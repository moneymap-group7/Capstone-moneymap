import { Injectable } from "@nestjs/common";
import { BankDetectService } from "./bank-detect.service";
import { BankId } from "./bank-id.types";
<<<<<<< HEAD
import { CsvAdapterRegistry } from "./csv-adapter.registry";
import { IngestionError } from "./ingestion-errors";

=======

import { CibcCsvParserService } from "./cibc-csv-parser.service";
import { RbcCsvParserService } from "./rbc-csv-parser.service";
import { TdCsvParserService } from "./td-csv-parser.service";
>>>>>>> 3fd7686 (implement automatic bank detection)

@Injectable()
export class CsvIngestionService {
  constructor(
    private readonly detector: BankDetectService,
<<<<<<< HEAD
    private readonly registry: CsvAdapterRegistry
  ) {}

  parse(buffer: Buffer): { bank: BankId; rows: any[] } {
    const csvText = buffer.toString("utf8"); // only for detection
    if (!csvText.trim()) {
      throw new IngestionError("EMPTY_FILE", "Uploaded CSV is empty.");
    }
    const bank = this.detector.detectFromCsvText(csvText);

    const adapter = this.registry.get(bank);

    if (!adapter) {
      throw new IngestionError("UNSUPPORTED_BANK", "Unsupported bank CSV format.", {
        bank,
        details: { supportedBanks: this.registry.listBanks() },
      });
    }

    let rows: any[];
    try {
      rows = adapter.parse({ buffer, csvText });
    } catch (err: any) {
      throw new IngestionError("PARSER_FAILED", err?.message ?? "CSV parser failed.", {
        bank,
      });
    }
    return { bank, rows };
    }
=======
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
>>>>>>> 3fd7686 (implement automatic bank detection)
}