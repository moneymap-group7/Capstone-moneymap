import { Injectable } from "@nestjs/common";
import { BankId } from "./bank-id.types";
import { CsvBankAdapter } from "./csv-adapter.types";

import { CibcCsvAdapter } from "./cibc.adapter";
import { RbcCsvAdapter } from "./rbc.adapter";
import { TdCsvAdapter } from "./td.adapter";
import { BmoCsvAdapter } from "./bmo.adapter";

@Injectable()
export class CsvAdapterRegistry {
  private readonly byBank = new Map<Exclude<BankId, "UNKNOWN">, CsvBankAdapter>();

constructor(
    private readonly cibc: CibcCsvAdapter,
    private readonly rbc: RbcCsvAdapter,
    private readonly td: TdCsvAdapter,
    private readonly bmo: BmoCsvAdapter
) {
    this.register(this.cibc);
    this.register(this.rbc);
    this.register(this.td);
    this.register(this.bmo);
}

  register(adapter: CsvBankAdapter) {
    this.byBank.set(adapter.bank, adapter);
  }

  get(bank: BankId): CsvBankAdapter | null {
    if (bank === "UNKNOWN") return null;
    return this.byBank.get(bank) ?? null;
  }

  listBanks(): Exclude<BankId, "UNKNOWN">[] {
    return Array.from(this.byBank.keys());
  }
}