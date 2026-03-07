import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CsvIngestionService } from "../parsing/csv/csv-ingestion.service";
import { StatementStatus, StatusResponse } from "./statement-status";
import {  isIngestionError } from "../parsing/csv/ingestion-errors";
import type { IngestionErrorCode } from "../parsing/csv/ingestion-errors";
import { HttpException } from "@nestjs/common";
import { CategoryResolverService } from "../common/categorization/category-resolver/category-resolver.service";
import { Prisma, TransactionSource, TransactionType } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class StatementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly csvIngestionService: CsvIngestionService,
    private readonly categoryResolver: CategoryResolverService
  ) {}

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
      // 1) Ensure CSV
      if (!params.relativePath.toLowerCase().endsWith(".csv")) {
        throw new UnprocessableEntityException("Only CSV statements are supported.");
      }

      // 2) Read file from disk (diskStorage)
      const absPath = path.join(process.cwd(), params.relativePath);
      const buffer = fs.readFileSync(absPath);

      // 3) Parse rows (auto-detect bank)
      const { bank, rows } = this.csvIngestionService.parse(buffer);
      detectedBank = bank ?? null;

      const parsed = rows ?? [];
      const userIdBigInt = BigInt(params.userId);

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
    const shouldSet =
      !current || String(current) === "UNCATEGORIZED";

    if (!shouldSet) {
      return {
        ...t,
        spendCategory: current,
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

      // Safe debug logging (no sample transaction rows)
      if (process.env.NODE_ENV !== "production") {
        console.info(`[CSV] ${detectedBank} rows parsed: ${parsed.length}`);
      }

      // If no transactions, still return the detected bank
      if (parsed.length === 0) {
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
        // amount: prefer explicit amount, else deposits - withdrawals
        const rawAmount =
          t.amount != null
            ? Number(t.amount)
            : Number(t.deposits ?? 0) - Number(t.withdrawals ?? 0);

        const amount = Number.isFinite(rawAmount) ? rawAmount : 0;

        // date: ensure Date object
        const txDate =
          t.transactionDate instanceof Date
            ? t.transactionDate
            : new Date(t.transactionDate);

        if (isNaN(txDate.getTime())) {
          throw new UnprocessableEntityException(
            `Invalid transactionDate: ${t.transactionDate}`
          );
        }

        // tx type: use provided if valid, else derive from sign
        const txType: TransactionType =
          t.transactionType === TransactionType.DEBIT ||
          t.transactionType === TransactionType.CREDIT
            ? t.transactionType
            : amount < 0
              ? TransactionType.DEBIT
              : TransactionType.CREDIT;

        return {
          userId: userIdBigInt,
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
          // Default message
          let message = e?.message ?? "Processing failed.";
          let errorCode: IngestionErrorCode | null = null;
          let extra: Record<string, any> = {};

          // If our ingestion layer threw a typed error
          if (isIngestionError(e)) {
            errorCode = e.code;
            if (e.bank) detectedBank = e.bank;
            if (e.details) extra = e.details;
          }

          // If a Nest HttpException was thrown (e.g., validateCibcRows throws BadRequestException)
          if (e instanceof HttpException) {
            const resp: any = e.getResponse?.();
            // If validator threw an object like { message, totalErrors, errors }
            if (resp && typeof resp === "object") {
              // keep message stable but not huge
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