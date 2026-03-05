import { Injectable } from "@nestjs/common";
import { BankDetectService } from "./bank-detect.service";
import { BankId } from "./bank-id.types";
import { CsvAdapterRegistry } from "./csv-adapter.registry";


@Injectable()
export class CsvIngestionService {
  constructor(
    private readonly detector: BankDetectService,
    private readonly registry: CsvAdapterRegistry
  ) {}

  parse(buffer: Buffer): { bank: BankId; rows: any[] } {
    const csvText = buffer.toString("utf8"); // only for detection
    const bank = this.detector.detectFromCsvText(csvText);

    const adapter = this.registry.get(bank);

    if (!adapter) {
      const supported = this.registry.listBanks().join(", ");
      throw new Error(
        `Unsupported bank CSV format (detected: ${bank}). Supported banks: ${supported}`
      );
    }

    const rows = adapter.parse({ buffer, csvText });
    return { bank, rows };
    }
}