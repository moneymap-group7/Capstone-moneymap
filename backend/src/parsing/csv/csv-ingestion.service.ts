import { Injectable } from "@nestjs/common";
import { BankDetectService } from "./bank-detect.service";
import { BankId } from "./bank-id.types";

import { CibcCsvParserService } from "./cibc-csv-parser.service";
import { RbcCsvParserService } from "./rbc-csv-parser.service";
import { TdCsvParserService } from "./td-csv-parser.service";

@Injectable()
export class CsvIngestionService {
  constructor(
    private readonly detector: BankDetectService,
    private readonly cibc: CibcCsvParserService,
    private readonly rbc: RbcCsvParserService,
    private readonly td: TdCsvParserService
  ) {}

  /**
   * US-1: Detect bank from CSV header and route to correct parser.
   * Input is a Buffer because your CIBC parser expects Buffer.
   */
  parse(buffer: Buffer): { bank: BankId; rows: any[] } {
    const csvText = buffer.toString("utf8"); // only for detection
    const bank = this.detector.detectFromCsvText(csvText);

    switch (bank) {
      case "CIBC":
        return { bank, rows: this.cibc.parse(buffer) }; 
      case "RBC":
        return { bank, rows: this.rbc.parse(csvText) };   
      case "TD":
        return { bank, rows: this.td.parse(csvText) };   
      default:
        throw new Error(
          "Unsupported bank CSV format. Please upload a CIBC, RBC, or TD statement export."
        );
    }
  }
}