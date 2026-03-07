import { Injectable } from "@nestjs/common";
import { BankDetectService } from "./bank-detect.service";
import { BankId } from "./bank-id.types";
import { CsvAdapterRegistry } from "./csv-adapter.registry";
import { IngestionError } from "./ingestion-errors";


@Injectable()
export class CsvIngestionService {
  constructor(
    private readonly detector: BankDetectService,
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
}