import { BankId } from "./bank-id.types";

export type CsvAdapterParseResult<Row> = {
  bank: Exclude<BankId, "UNKNOWN">;
  rows: Row[];
};

export interface CsvBankAdapter<Row = any> {
  readonly bank: Exclude<BankId, "UNKNOWN">;

  /**
   * Allow both buffer + text so ingestion can call adapters uniformly.
   * Some banks parse from Buffer, others parse from text.
   */
  parse(input: { buffer: Buffer; csvText: string }): Row[];
}