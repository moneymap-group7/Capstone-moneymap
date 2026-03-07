import { Module } from "@nestjs/common";

import { BankDetectService } from "./csv/bank-detect.service";
import { CsvIngestionService } from "./csv/csv-ingestion.service";

import { CibcCsvParserService } from "./csv/cibc-csv-parser.service";
import { RbcCsvParserService } from "./csv/rbc-csv-parser.service";
import { TdCsvParserService } from "./csv/td-csv-parser.service";

import { CsvAdapterRegistry } from "./csv/csv-adapter.registry";

import { CibcCsvAdapter } from "./csv/cibc.adapter";
import { RbcCsvAdapter } from "./csv/rbc.adapter";
import { TdCsvAdapter } from "./csv/td.adapter";
import { BmoCsvAdapter } from "./csv/bmo.adapter";
import { BmoCsvParserService } from "./csv/bmo-csv-parser.service";

@Module({
  providers: [
  // detection + ingestion
  BankDetectService,
  CsvIngestionService,

  // parsers
  CibcCsvParserService,
  RbcCsvParserService,
  TdCsvParserService,
  BmoCsvParserService,

  // adapter selection (registry + adapters + bootstrap)
  CsvAdapterRegistry,
  CibcCsvAdapter,
  RbcCsvAdapter,
  TdCsvAdapter,
  BmoCsvAdapter,
  ],
  exports: [CsvIngestionService], // export so other modules (Statements) can use it
})
export class ParsingModule {}