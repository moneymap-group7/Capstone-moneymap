import { describe, beforeEach, it, expect, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { BmoCsvAdapter } from "./bmo.adapter";
import { BmoCsvParserService } from "./bmo-csv-parser.service";

describe("BmoCsvAdapter", () => {
  let service: BmoCsvAdapter;

  const mockParser = {
    parse: jest.fn<any>(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BmoCsvAdapter,
        {
          provide: BmoCsvParserService,
          useValue: mockParser,
        },
      ],
    }).compile();

    service = module.get<BmoCsvAdapter>(BmoCsvAdapter);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
    expect(service.bank).toBe("BMO");
  });

  it("should delegate parsing to BMO parser using csvText input", () => {
    const expected = [{ some: "row" }];

    mockParser.parse.mockReturnValue(expected);

    const result = service.parse({
      buffer: Buffer.from("ignored-buffer"),
      csvText: "bmo csv text",
    });

    expect(mockParser.parse).toHaveBeenCalledWith("bmo csv text");
    expect(result).toBe(expected);
  });
});
