import { describe, beforeEach, it, expect, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { TransactionSource, TransactionType } from "@prisma/client";
import { TdCsvAdapter } from "./td.adapter";
import { TdCsvParserService } from "./td-csv-parser.service";

describe("TdCsvAdapter", () => {
  let service: TdCsvAdapter;

  const mockParser = {
    parse: jest.fn<any>(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TdCsvAdapter,
        {
          provide: TdCsvParserService,
          useValue: mockParser,
        },
      ],
    }).compile();

    service = module.get<TdCsvAdapter>(TdCsvAdapter);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
    expect(service.bank).toBe("TD");
  });

  it("should map withdrawal rows to negative debit transactions", () => {
    mockParser.parse.mockReturnValue([
      {
        date: "2026-01-01",
        description: "TD PURCHASE",
        withdrawal: "25.50",
        deposit: "",
        balance: "1000.75",
      },
    ]);

    const result = service.parse({
      buffer: Buffer.from("ignored-buffer"),
      csvText: "td csv text",
    });

    expect(mockParser.parse).toHaveBeenCalledWith("td csv text");
    expect(result).toEqual([
      {
        transactionDate: "2026-01-01",
        description: "TD PURCHASE",
        amount: -25.5,
        transactionType: TransactionType.DEBIT,
        currency: "CAD",
        source: TransactionSource.CSV,
        balanceAfter: 1000.75,
      },
    ]);
  });

  it("should map deposit rows to positive credit transactions", () => {
    mockParser.parse.mockReturnValue([
      {
        date: "2026-01-02",
        description: "TD DEPOSIT",
        withdrawal: "",
        deposit: "250.00",
        balance: "1250.75",
      },
    ]);

    const result = service.parse({
      buffer: Buffer.from("ignored-buffer"),
      csvText: "td csv text",
    });

    expect(result).toEqual([
      {
        transactionDate: "2026-01-02",
        description: "TD DEPOSIT",
        amount: 250,
        transactionType: TransactionType.CREDIT,
        currency: "CAD",
        source: TransactionSource.CSV,
        balanceAfter: 1250.75,
      },
    ]);
  });

  it("should handle missing balance as null", () => {
    mockParser.parse.mockReturnValue([
      {
        date: "2026-01-03",
        description: "TD ENTRY",
        withdrawal: "",
        deposit: "10.00",
        balance: "",
      },
    ]);

    const result = service.parse({
      buffer: Buffer.from("ignored-buffer"),
      csvText: "td csv text",
    });

    expect(result[0].balanceAfter).toBeNull();
  });

  it("should remove commas when converting numbers", () => {
    mockParser.parse.mockReturnValue([
      {
        date: "2026-01-04",
        description: "TD LARGE DEPOSIT",
        withdrawal: "",
        deposit: "1,250.99",
        balance: "5,100.44",
      },
    ]);

    const result = service.parse({
      buffer: Buffer.from("ignored-buffer"),
      csvText: "td csv text",
    });

    expect(result).toEqual([
      {
        transactionDate: "2026-01-04",
        description: "TD LARGE DEPOSIT",
        amount: 1250.99,
        transactionType: TransactionType.CREDIT,
        currency: "CAD",
        source: TransactionSource.CSV,
        balanceAfter: 5100.44,
      },
    ]);
  });
});
