import { describe, beforeEach, it, expect, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { RbcCsvAdapter } from "./rbc.adapter";
import { RbcCsvParserService } from "./rbc-csv-parser.service";

describe("RbcCsvAdapter", () => {
  let service: RbcCsvAdapter;

  const mockParser = {
    parse: jest.fn<any>(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RbcCsvAdapter,
        {
          provide: RbcCsvParserService,
          useValue: mockParser,
        },
      ],
    }).compile();

    service = module.get<RbcCsvAdapter>(RbcCsvAdapter);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
    expect(service.bank).toBe("RBC");
  });

  it("should delegate parsing to RBC parser using csvText input", () => {
    const expected = [{ some: "row" }];

    mockParser.parse.mockReturnValue(expected);

    const result = service.parse({
      buffer: Buffer.from("ignored-buffer"),
      csvText: "rbc csv text",
    });

    expect(mockParser.parse).toHaveBeenCalledWith("rbc csv text");
    expect(result).toBe(expected);
  });
});
