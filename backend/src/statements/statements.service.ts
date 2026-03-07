import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CibcCsvParserService } from "../parsing/csv/cibc-csv-parser.service";
import { StatementStatus, StatusResponse } from "./statement-status";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class StatementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cibcCsvParser: CibcCsvParserService,
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
    };

    try {
      // 1) Ensure CSV
      if (!params.relativePath.toLowerCase().endsWith(".csv")) {
        throw new UnprocessableEntityException("Only CSV statements are supported.");
      }

      // 2) Read file from disk (you used diskStorage)
      const absPath = path.join(process.cwd(), params.relativePath);
      const buffer = fs.readFileSync(absPath);

      // 3) Parse rows (CIBC)
      const parsed = this.cibcCsvParser.parse(buffer);

      console.log("CIBC parsed rows:", parsed.length);
      console.log("CIBC sample row:", parsed[0]);

      // 4) Save to DB
      const userIdBigInt = BigInt(params.userId);

      const result = await this.prisma.transaction.createMany({
        data: parsed.map((t) => ({
          userId: userIdBigInt,
          transactionDate: t.transactionDate,
          description: t.description,
          amount: t.amount, // Decimal string ok
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
        details: { transactionsInserted: result.count },
      };
    } catch (e: any) {
      return {
        ...base,
        status: StatementStatus.FAILED,
        message: e?.message ?? "Processing failed.",
      };
    }
  }
}