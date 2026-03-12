import { Test } from "@nestjs/testing";
import { ParsingModule } from "../parsing.module";
import { CsvIngestionService } from "./csv-ingestion.service";

describe("CsvIngestionService Adapter Selection", () => {
  let service: CsvIngestionService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ParsingModule],
    }).compile();

    service = moduleRef.get(CsvIngestionService);
  });

  it("detects RBC and routes to RBC adapter", () => {
    // Minimal RBC header signature from your detector:
    const csv = [
      "Transaction Date,Description,Withdrawals,Deposits,Balance",
      "2026-01-01,Test,10.00,,100.00",
    ].join("\n");

    const { bank, rows } = service.parse(Buffer.from(csv, "utf8"));

    expect(bank).toBe("RBC");
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThan(0);
  });

  it("returns UNKNOWN for unrecognized headers", () => {
    const csv = ["foo,bar,baz", "1,2,3"].join("\n");

    expect(() => service.parse(Buffer.from(csv, "utf8"))).toThrow(
      /Unsupported bank CSV format/
    );
  });

  it("detects TD and routes to TD adapter", () => {
    const csv = [
    "Date,Description,Withdrawal,Deposit",
    "2026-01-01,Test,10.00,",
    ].join("\n");

   const { bank, rows } = service.parse(Buffer.from(csv, "utf8"));

   expect(bank).toBe("TD");
   expect(Array.isArray(rows)).toBe(true);
  expect(rows.length).toBeGreaterThan(0);
 });
});