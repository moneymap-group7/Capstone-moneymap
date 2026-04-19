import { Injectable } from "@nestjs/common";
import { CsvBankAdapter } from "./csv-adapter.types";
import { BmoCsvParserService } from "./bmo-csv-parser.service";

@Injectable()
export class BmoCsvAdapter implements CsvBankAdapter {
  readonly bank = "BMO" as const;

  constructor(private readonly parser: BmoCsvParserService) {}

  parse(input: { buffer: Buffer; csvText: string }) {
    return this.parser.parse(input.csvText);
  }
}