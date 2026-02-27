import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CsvIngestionService } from "../parsing/csv/csv-ingestion.service";
import { StatementStatus, StatusResponse } from "./statement-status";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class StatementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly csvIngestionService: CsvIngestionService
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
      };
    } catch (e: any) {
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
}