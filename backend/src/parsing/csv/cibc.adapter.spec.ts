import { describe, beforeEach, it, expect, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { CibcCsvAdapter } from "./cibc.adapter";
import { CibcCsvParserService } from "./cibc-csv-parser.service";

describe("CibcCsvAdapter", () => {
  let service: CibcCsvAdapter;

  const mockParser = {
    parse: jest.fn<any>(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CibcCsvAdapter,
        {
          provide: CibcCsvParserService,
          useValue: mockParser,
        },
      ],
    }).compile();

    service = module.get<CibcCsvAdapter>(CibcCsvAdapter);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
    expect(service.bank).toBe("CIBC");
  });

  it("should delegate parsing to CIBC parser using buffer input", () => {
    const buffer = Buffer.from("sample");
    const expected = [{ some: "row" }];

    mockParser.parse.mockReturnValue(expected);

    const result = service.parse({
      buffer,
      csvText: "ignored-text",
    });

    expect(mockParser.parse).toHaveBeenCalledWith(buffer);
    expect(result).toBe(expected);
  });
});
