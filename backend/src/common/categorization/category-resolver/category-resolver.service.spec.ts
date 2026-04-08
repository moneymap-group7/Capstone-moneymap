import { describe, beforeEach, it, expect, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { Prisma, SpendCategory, TransactionType } from "@prisma/client";
import { CategoryResolverService } from "./category-resolver.service";
import { RuleEngineService } from "../../../rules/rule-engine/rule-engine.service";
import { AutoCategorizeService } from "../auto-categorize.service";

describe("CategoryResolverService", () => {
  let service: CategoryResolverService;

  const mockRuleEngineService = {
    evaluate: jest.fn<any>(),
  };

  const mockAutoCategorizeService = {
    categorize: jest.fn<any>(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryResolverService,
        {
          provide: RuleEngineService,
          useValue: mockRuleEngineService,
        },
        {
          provide: AutoCategorizeService,
          useValue: mockAutoCategorizeService,
        },
      ],
    }).compile();

    service = module.get<CategoryResolverService>(CategoryResolverService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should return the user rule category when a rule matches", async () => {
    mockRuleEngineService.evaluate.mockResolvedValue(
      SpendCategory.TRANSPORTATION,
    );
    mockAutoCategorizeService.categorize.mockReturnValue(
      SpendCategory.OTHER,
    );

    const input = {
      userId: BigInt(1),
      description: "UBER CANADA",
      amount: new Prisma.Decimal("15.99"),
      transactionType: TransactionType.DEBIT,
    };

    const result = await service.resolve(input);

    expect(mockRuleEngineService.evaluate).toHaveBeenCalledWith(input);
    expect(mockAutoCategorizeService.categorize).not.toHaveBeenCalled();
    expect(result).toBe(SpendCategory.TRANSPORTATION);
  });

  it("should fall back to auto-categorization when no user rule matches", async () => {
    mockRuleEngineService.evaluate.mockResolvedValue(null);
    mockAutoCategorizeService.categorize.mockReturnValue(
      SpendCategory.FOOD_AND_DINING,
    );

    const input = {
      userId: BigInt(1),
      description: "STARBUCKS #123",
      amount: new Prisma.Decimal("7.25"),
      transactionType: TransactionType.DEBIT,
    };

    const result = await service.resolve(input);

    expect(mockRuleEngineService.evaluate).toHaveBeenCalledWith(input);
    expect(mockAutoCategorizeService.categorize).toHaveBeenCalledWith({
      description: "STARBUCKS #123",
    });
    expect(result).toBe(SpendCategory.FOOD_AND_DINING);
  });

  it("should prioritize rule engine result over auto-categorization result", async () => {
    mockRuleEngineService.evaluate.mockResolvedValue(
      SpendCategory.TRAVEL,
    );
    mockAutoCategorizeService.categorize.mockReturnValue(
      SpendCategory.TRANSPORTATION,
    );

    const result = await service.resolve({
      userId: BigInt(2),
      description: "UBER AIRPORT",
      amount: new Prisma.Decimal("42.00"),
      transactionType: TransactionType.DEBIT,
    });

    expect(result).toBe(SpendCategory.TRAVEL);
    expect(mockAutoCategorizeService.categorize).not.toHaveBeenCalled();
  });
});