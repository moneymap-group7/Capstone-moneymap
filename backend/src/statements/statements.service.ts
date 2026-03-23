import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CsvIngestionService } from "../parsing/csv/csv-ingestion.service";
import { StatementStatus, StatusResponse } from "./statement-status";
import { isIngestionError } from "../parsing/csv/ingestion-errors";
import type { IngestionErrorCode } from "../parsing/csv/ingestion-errors";
import { HttpException } from "@nestjs/common";
import { CategoryResolverService } from "../common/categorization/category-resolver/category-resolver.service";
import { Prisma, TransactionSource, TransactionType } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { createHash } from "crypto";

@Injectable()
export class StatementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly csvIngestionService: CsvIngestionService,
    private readonly categoryResolver: CategoryResolverService
  ) {}

  private getFileHash(buffer: Buffer): string {
    return createHash("sha256").update(buffer).digest("hex");
  }

  async processUploadedStatement(params: {
    userId: string;
    originalFileName: string;
    storedFileName: string;
    relativePath: string;
    size: number;
    mimeType: string;
  }): Promise<StatusResponse> {
    const base: StatusResponse = {
      status: StatementStatus.UPLOADED,
      message: "File stored. Starting parsing.",
      statement: { ...params },
      details: {
        bank: null,
        transactionsInserted: 0,
      },
    };

    let detectedBank: string | null = null;

    try {
      if (!params.relativePath.toLowerCase().endsWith(".csv")) {
        throw new UnprocessableEntityException("Only CSV statements are supported.");
      }

      const absPath = path.join(process.cwd(), params.relativePath);
      const buffer = fs.readFileSync(absPath);
      const fileHash = this.getFileHash(buffer);
      const userIdBigInt = BigInt(params.userId);

      // Prevent parsing the same CSV more than once for the same user
      const existingStatement = await this.prisma.statement.findFirst({
        where: {
          userId: userIdBigInt,
          fileHash,
        },
      });

      if (existingStatement?.status === StatementStatus.COMPLETED) {
        return {
          ...base,
          status: StatementStatus.COMPLETED,
          message: "This CSV has already been processed.",
          details: {
            bank: existingStatement.bank ?? null,
            transactionsInserted: 0,
            duplicate: true,
          } as any,
        };
      }

      const { bank, rows } = this.csvIngestionService.parse(buffer);
      detectedBank = bank ?? null;

      const parsed = rows ?? [];

      const categorized = await Promise.all(
        parsed.map(async (t: any) => {
          const rawAmount =
            t.amount != null
              ? Number(t.amount)
              : Number(t.deposits ?? 0) - Number(t.withdrawals ?? 0);

          const amount = Number.isFinite(rawAmount) ? rawAmount : 0;

          const txType: TransactionType =
            t.transactionType === TransactionType.DEBIT ||
            t.transactionType === TransactionType.CREDIT
              ? t.transactionType
              : amount < 0
                ? TransactionType.DEBIT
                : TransactionType.CREDIT;

          const current = t.spendCategory;
          const shouldSet = !current || String(current) === "UNCATEGORIZED";

          if (!shouldSet) {
            return {
              ...t,
              spendCategory: current,
              transactionType: txType,
            };
          }

          const spendCategory = await this.categoryResolver.resolve({
            userId: userIdBigInt,
            description: String(t.description ?? ""),
            amount: new Prisma.Decimal(amount),
            transactionType: txType,
          });

          return {
            ...t,
            spendCategory,
            transactionType: txType,
          };
        }),
      );

      if (process.env.NODE_ENV !== "production") {
        console.info(`[CSV] ${detectedBank} rows parsed: ${parsed.length}`);
      }

      // Save statement record first so hash is reserved
            // Save statement record first so hash is reserved
      const statement = existingStatement
        ? await this.prisma.statement.update({
            where: { statementId: existingStatement.statementId },
            data: {
              originalFileName: params.originalFileName,
              storedFileName: params.storedFileName,
              relativePath: params.relativePath,
              size: params.size,
              mimeType: params.mimeType,
              bank: detectedBank,
              fileHash,
              status:
                parsed.length === 0
                  ? StatementStatus.COMPLETED
                  : StatementStatus.PROCESSING,
            },
          })
        : await this.prisma.statement.create({
            data: {
              userId: userIdBigInt,
              originalFileName: params.originalFileName,
              storedFileName: params.storedFileName,
              relativePath: params.relativePath,
              size: params.size,
              mimeType: params.mimeType,
              bank: detectedBank,
              fileHash,
              status:
                parsed.length === 0
                  ? StatementStatus.COMPLETED
                  : StatementStatus.PROCESSING,
            },
          });

      if (parsed.length === 0) {
        await this.prisma.statement.update({
          where: { statementId: statement.statementId },
          data: {
            status: StatementStatus.COMPLETED,
          },
        });

        return {
          ...base,
          status: StatementStatus.COMPLETED,
          message: "Statement processed successfully (no transactions found).",
          details: {
            bank: detectedBank,
            transactionsInserted: 0,
          },
        };
      }

      const result = await this.prisma.transaction.createMany({
        data: categorized.map((t: any) => {
          const rawAmount =
            t.amount != null
              ? Number(t.amount)
              : Number(t.deposits ?? 0) - Number(t.withdrawals ?? 0);

          const amount = Number.isFinite(rawAmount) ? rawAmount : 0;

          const txDate =
            t.transactionDate instanceof Date
              ? t.transactionDate
              : new Date(t.transactionDate);

          if (isNaN(txDate.getTime())) {
            throw new UnprocessableEntityException(
              `Invalid transactionDate: ${t.transactionDate}`
            );
          }

          const txType: TransactionType =
            t.transactionType === TransactionType.DEBIT ||
            t.transactionType === TransactionType.CREDIT
              ? t.transactionType
              : amount < 0
                ? TransactionType.DEBIT
                : TransactionType.CREDIT;

          return {
            userId: userIdBigInt,
            statementId: statement.statementId,
            transactionDate: txDate,
            description: String(t.description ?? "").slice(0, 255),
            amount,
            currency: t.currency ?? "CAD",
            transactionType: txType,
            source: t.source ?? TransactionSource.CSV,
            spendCategory: t.spendCategory,
            cardLast4: t.cardLast4 ?? null,
            balanceAfter: t.balanceAfter ?? null,
          };
        }),
      });

      await this.prisma.statement.update({
        where: { statementId: statement.statementId },
        data: {
          status: StatementStatus.COMPLETED,
        },
      });

      return {
        ...base,
        status: StatementStatus.COMPLETED,
        message: "Statement processed successfully.",
        details: {
          bank: detectedBank,
          transactionsInserted: result.count,
        },
      };
    } catch (e: any) {
      let message = e?.message ?? "Processing failed.";
      let errorCode: IngestionErrorCode | null = null;
      let extra: Record<string, any> = {};

      if (isIngestionError(e)) {
        errorCode = e.code;
        if (e.bank) detectedBank = e.bank;
        if (e.details) extra = e.details;
      }

      if (e instanceof HttpException) {
        const resp: any = e.getResponse?.();
        if (resp && typeof resp === "object") {
          message = resp.message ?? message;
          if (!errorCode) errorCode = "VALIDATION_FAILED";
          if (resp.errors) extra.errors = resp.errors;
          if (resp.totalErrors) extra.totalErrors = resp.totalErrors;
        }
      }

      return {
        ...base,
        status: StatementStatus.FAILED,
        message,
        details: {
          bank: detectedBank,
          transactionsInserted: 0,
          errorCode,
          ...extra,
        },
      };
    }
  }
}