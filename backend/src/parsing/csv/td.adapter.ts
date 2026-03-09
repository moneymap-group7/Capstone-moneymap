import { Injectable } from "@nestjs/common";
import { CsvBankAdapter } from "./csv-adapter.types";
import { TdCsvParserService } from "./td-csv-parser.service";

@Injectable()
export class TdCsvAdapter implements CsvBankAdapter {
  readonly bank = "TD" as const;

  constructor(private readonly parser: TdCsvParserService) {}

  parse(input: { buffer: Buffer; csvText: string }) {
    return this.parser.parse(input.csvText);
  }
}