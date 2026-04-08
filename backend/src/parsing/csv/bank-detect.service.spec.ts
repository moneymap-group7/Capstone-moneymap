import { describe, beforeEach, it, expect } from "@jest/globals";
import { BankDetectService } from "./bank-detect.service";

describe("BankDetectService", () => {
  let service: BankDetectService;

  beforeEach(() => {
    service = new BankDetectService();
  });

  it("should detect RBC from standard headers", () => {
    const result = service.detectFromHeaders([
      "Transaction Date",
      "Description",
      "Withdrawals",
      "Deposits",
    ]);

    expect(result).toBe("RBC");
  });

  it("should detect TD from standard headers", () => {
    const result = service.detectFromHeaders([
      "Date",
      "Description",
      "Withdrawal",
      "Deposit",
      "Balance",
    ]);

    expect(result).toBe("TD");
  });

  it("should detect CIBC from standard headers", () => {
    const result = service.detectFromHeaders([
      "Date",
      "Description",
      "Debit",
      "Credit",
    ]);

    expect(result).toBe("CIBC");
  });

  it("should detect BMO from standard headers", () => {
    const result = service.detectFromHeaders([
      "Date",
      "Description",
      "Amount",
      "Balance",
    ]);

    expect(result).toBe("BMO");
  });

  it("should return UNKNOWN for empty headers", () => {
    const result = service.detectFromHeaders([]);

    expect(result).toBe("UNKNOWN");
  });

  it("should return UNKNOWN for unrecognized headers", () => {
    const result = service.detectFromHeaders([
      "Col1",
      "Col2",
      "Col3",
    ]);

    expect(result).toBe("UNKNOWN");
  });

  it("should detect RBC from CSV text with header row", () => {
    const csvText = [
      "Transaction Date,Description,Withdrawals,Deposits",
      "2026-01-01,TEST PURCHASE,10.00,",
    ].join("\n");

    const result = service.detectFromCsvText(csvText);

    expect(result).toBe("RBC");
  });

  it("should detect CIBC from headerless five-column masked account format", () => {
    const csvText = [
      '2026-01-01,"PAYMENT",-25.00,,"****1234"',
      '2026-01-02,"GROCERY",-50.00,,"****1234"',
    ].join("\n");

    const result = service.detectFromCsvText(csvText);

    expect(result).toBe("CIBC");
  });

  it("should detect TD from repeated headerless TD-style rows", () => {
    const csvText = [
      '2026-01-01,"TD PAYMENT",25.00,,1000.00',
      '2026-01-02,"TD DEPOSIT",,50.00,1050.00',
    ].join("\n");

    const result = service.detectFromCsvText(csvText);

    expect(result).toBe("TD");
  });

  it("should return UNKNOWN for empty CSV text", () => {
    const result = service.detectFromCsvText("");

    expect(result).toBe("UNKNOWN");
  });

  it("should return UNKNOWN for unrecognized CSV text", () => {
    const csvText = [
      "hello,world,test",
      "a,b,c",
    ].join("\n");

    const result = service.detectFromCsvText(csvText);

    expect(result).toBe("UNKNOWN");
  });
});
