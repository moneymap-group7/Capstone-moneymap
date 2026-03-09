import { Injectable } from "@nestjs/common";
import { CsvBankAdapter } from "./csv-adapter.types";
import { CibcCsvParserService } from "./cibc-csv-parser.service";

@Injectable()
export class CibcCsvAdapter implements CsvBankAdapter {
  readonly bank = "CIBC" as const;

  constructor(private readonly parser: CibcCsvParserService) {}

  parse(input: { buffer: Buffer; csvText: string }) {
    return this.parser.parse(input.buffer);
  }
}