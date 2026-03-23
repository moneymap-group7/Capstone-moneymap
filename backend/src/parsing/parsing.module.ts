import { Module } from "@nestjs/common";

import { BankDetectService } from "./csv/bank-detect.service";
import { CsvIngestionService } from "./csv/csv-ingestion.service";

import { CibcCsvParserService } from "./csv/cibc-csv-parser.service";
import { RbcCsvParserService } from "./csv/rbc-csv-parser.service";
import { TdCsvParserService } from "./csv/td-csv-parser.service";

// If you added BMO, include these too:
 import { BmoCsvParserService } from "./csv/bmo-csv-parser.service";

@Module({
  providers: [
    BankDetectService,
    CsvIngestionService,
    CibcCsvParserService,
    RbcCsvParserService,
    TdCsvParserService,
    BmoCsvParserService,
  ],
  exports: [CsvIngestionService], // export so other modules (Statements) can use it
})
export class ParsingModule {}