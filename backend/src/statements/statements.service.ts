import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CsvIngestionService } from "../parsing/csv/csv-ingestion.service";
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
    private readonly csvIngestionService: CsvIngestionService
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
      details: {
        bank: null,
        transactionsInserted: 0,
      },
    };

    let detectedBank: string | null = null;

    let detectedBank: string | null = null;

    try {
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
          details: {
            bank: detectedBank,
            transactionsInserted: 0,
          },
        };
      }

      // 4) Save to DB
      const userIdBigInt = BigInt(params.userId);

      const result = await this.prisma.transaction.createMany({
        data: parsed.map((t: any) => ({
          userId: userIdBigInt,
          transactionDate: t.transactionDate,
          description: t.description,
          // Ensure Prisma required field is never undefined
          amount: Number(t.amount ?? t.deposits ?? t.withdrawals ?? 0),
          currency: t.currency ?? "CAD",
          transactionType: t.transactionType,
          source: t.source,
          spendCategory: t.spendCategory,
          cardLast4: t.cardLast4 ?? null,
          balanceAfter: t.balanceAfter ?? null,
        })),
      });

      return {
        ...base,
        status: StatementStatus.COMPLETED,
        message: "Statement processed successfully.",
        details: {
          bank: detectedBank,
          transactionsInserted: result.count,
        },
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
        message: e?.message ?? "Processing failed.",
        details: {
          bank: detectedBank,
          transactionsInserted: 0,
        },
      };
    }
  }
 async getUserStatements(userId: string) {
  const userIdBigInt = BigInt(userId);

  const statements = await this.prisma.statement.findMany({
    where: { userId: userIdBigInt },
    orderBy: { createdAt: "desc" },
    select: {
      statementId: true,
      originalFileName: true,
      bank: true,
      status: true,
      createdAt: true,
    },
  });
}
async deleteStatement(userId: string, statementId: string) {
  const userIdBigInt = BigInt(userId);
  const statementIdBigInt = BigInt(statementId);

  const statement = await this.prisma.statement.findFirst({
    where: {
      statementId: statementIdBigInt,
      userId: userIdBigInt,
    },
  });

  if (!statement) {
    throw new Error("Statement not found");
  }

  try {
    const absPath = path.join(process.cwd(), statement.relativePath);
    if (fs.existsSync(absPath)) {
      fs.unlinkSync(absPath);
    }
  } catch (err) {
    console.warn("File delete failed:", err);
  }

  await this.prisma.statement.delete({
    where: { statementId: statementIdBigInt },
  });

  return { message: "Statement deleted successfully" };
}
}