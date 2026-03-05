import { Injectable } from "@nestjs/common";
import { CsvBankAdapter } from "./csv-adapter.types";
import { RbcCsvParserService } from "./rbc-csv-parser.service";

@Injectable()
export class RbcCsvAdapter implements CsvBankAdapter {
  readonly bank = "RBC" as const;

  constructor(private readonly parser: RbcCsvParserService) {}

  parse(input: { buffer: Buffer; csvText: string }) {
    return this.parser.parse(input.csvText);
  }
}