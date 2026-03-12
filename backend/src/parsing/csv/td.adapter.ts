import { Injectable } from "@nestjs/common";
import { TransactionSource, TransactionType } from "@prisma/client";
import { CsvBankAdapter } from "./csv-adapter.types";
import { TdCsvParserService } from "./td-csv-parser.service";

@Injectable()
export class TdCsvAdapter implements CsvBankAdapter {
  readonly bank = "TD" as const;

  constructor(private readonly parser: TdCsvParserService) {}

    parse(input: { buffer: Buffer; csvText: string }) {
    const rows = this.parser.parse(input.csvText);

    return rows.map((row) => {
      const withdrawal = Number((row.withdrawal ?? "0").replace(/,/g, ""));
      const deposit = Number((row.deposit ?? "0").replace(/,/g, ""));
      const balance =
        row.balance != null && row.balance !== ""
          ? Number(row.balance.replace(/,/g, ""))
          : null;

      const hasWithdrawal = Number.isFinite(withdrawal) && withdrawal > 0;
      const hasDeposit = Number.isFinite(deposit) && deposit > 0;

      let amount = 0;
      let transactionType: TransactionType = TransactionType.CREDIT;

      if (hasWithdrawal) {
        amount = -withdrawal;
        transactionType = TransactionType.DEBIT;
      } else if (hasDeposit) {
        amount = deposit;
        transactionType = TransactionType.CREDIT;
      }

      return {
        transactionDate: row.date,
        description: row.description,
        amount,
        transactionType,
        currency: "CAD",
        source: TransactionSource.CSV,
        balanceAfter: balance,
      };
    });
  }
}