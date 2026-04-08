import { describe, beforeEach, it, expect, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { Prisma, SpendCategory, TransactionType } from "@prisma/client";
import { RuleEngineService } from "./rule-engine.service";
import { PrismaService } from "../../prisma/prisma.service";

describe("RuleEngineService", () => {
  let service: RuleEngineService;

  const mockPrisma = {
    userCategoryRule: {
      findMany: jest.fn<any>(),
    },
    transaction: {
      findMany: jest.fn<any>(),
      update: jest.fn<any>(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RuleEngineService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<RuleEngineService>(RuleEngineService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should match merchantContains ignoring case and extra spaces", async () => {
    mockPrisma.userCategoryRule.findMany.mockResolvedValue([
      {
        ruleId: BigInt(1),
        userId: BigInt(1),
        isActive: true,
        priority: 1,
        merchantContains: "uber",
        merchantEquals: null,
        minAmount: null,
        maxAmount: null,
        transactionType: null,
        spendCategory: SpendCategory.TRANSPORTATION,
      },
    ]);

    const result = await service.evaluate({
      userId: BigInt(1),
      description: "  UBER   CANADA / UBERTRIP  ",
      amount: new Prisma.Decimal("-14.22"),
      transactionType: TransactionType.DEBIT,
    });

    expect(result).toBe(SpendCategory.TRANSPORTATION);
  });

  it("should match merchantEquals exactly after normalization", async () => {
    mockPrisma.userCategoryRule.findMany.mockResolvedValue([
      {
        ruleId: BigInt(1),
        userId: BigInt(1),
        isActive: true,
        priority: 1,
        merchantContains: null,
        merchantEquals: "STARBUCKS #123",
        minAmount: null,
        maxAmount: null,
        transactionType: null,
        spendCategory: SpendCategory.FOOD_AND_DINING,
      },
    ]);

    const result = await service.evaluate({
      userId: BigInt(1),
      description: "  starbucks   #123 ",
      amount: new Prisma.Decimal("-8.50"),
      transactionType: TransactionType.DEBIT,
    });

    expect(result).toBe(SpendCategory.FOOD_AND_DINING);
  });

  it("should reject when amount is below minAmount", async () => {
    mockPrisma.userCategoryRule.findMany.mockResolvedValue([
      {
        ruleId: BigInt(1),
        userId: BigInt(1),
        isActive: true,
        priority: 1,
        merchantContains: "UBER",
        merchantEquals: null,
        minAmount: new Prisma.Decimal("20"),
        maxAmount: null,
        transactionType: null,
        spendCategory: SpendCategory.TRANSPORTATION,
      },
    ]);

    const result = await service.evaluate({
      userId: BigInt(1),
      description: "UBER TRIP",
      amount: new Prisma.Decimal("10"),
      transactionType: TransactionType.DEBIT,
    });

    expect(result).toBeNull();
  });

  it("should reject when amount is above maxAmount", async () => {
    mockPrisma.userCategoryRule.findMany.mockResolvedValue([
      {
        ruleId: BigInt(1),
        userId: BigInt(1),
        isActive: true,
        priority: 1,
        merchantContains: "UBER",
        merchantEquals: null,
        minAmount: null,
        maxAmount: new Prisma.Decimal("20"),
        transactionType: null,
        spendCategory: SpendCategory.TRANSPORTATION,
      },
    ]);

    const result = await service.evaluate({
      userId: BigInt(1),
      description: "UBER TRIP",
      amount: new Prisma.Decimal("25"),
      transactionType: TransactionType.DEBIT,
    });

    expect(result).toBeNull();
  });

  it("should match when amount is within minAmount and maxAmount", async () => {
    mockPrisma.userCategoryRule.findMany.mockResolvedValue([
      {
        ruleId: BigInt(1),
        userId: BigInt(1),
        isActive: true,
        priority: 1,
        merchantContains: "UBER",
        merchantEquals: null,
        minAmount: new Prisma.Decimal("10"),
        maxAmount: new Prisma.Decimal("30"),
        transactionType: null,
        spendCategory: SpendCategory.TRANSPORTATION,
      },
    ]);

    const result = await service.evaluate({
      userId: BigInt(1),
      description: "UBER TRIP",
      amount: new Prisma.Decimal("20"),
      transactionType: TransactionType.DEBIT,
    });

    expect(result).toBe(SpendCategory.TRANSPORTATION);
  });

  it("should reject when transaction type does not match", async () => {
    mockPrisma.userCategoryRule.findMany.mockResolvedValue([
      {
        ruleId: BigInt(1),
        userId: BigInt(1),
        isActive: true,
        priority: 1,
        merchantContains: "PAYROLL",
        merchantEquals: null,
        minAmount: null,
        maxAmount: null,
        transactionType: TransactionType.CREDIT,
        spendCategory: SpendCategory.INCOME,
      },
    ]);

    const result = await service.evaluate({
      userId: BigInt(1),
      description: "PAYROLL DEPOSIT",
      amount: new Prisma.Decimal("2000"),
      transactionType: TransactionType.DEBIT,
    });

    expect(result).toBeNull();
  });

  it("should match when transaction type matches", async () => {
    mockPrisma.userCategoryRule.findMany.mockResolvedValue([
      {
        ruleId: BigInt(1),
        userId: BigInt(1),
        isActive: true,
        priority: 1,
        merchantContains: "PAYROLL",
        merchantEquals: null,
        minAmount: null,
        maxAmount: null,
        transactionType: TransactionType.CREDIT,
        spendCategory: SpendCategory.INCOME,
      },
    ]);

    const result = await service.evaluate({
      userId: BigInt(1),
      description: "PAYROLL DEPOSIT",
      amount: new Prisma.Decimal("2000"),
      transactionType: TransactionType.CREDIT,
    });

    expect(result).toBe(SpendCategory.INCOME);
  });

  it("should return the first matching rule by priority order", async () => {
    mockPrisma.userCategoryRule.findMany.mockResolvedValue([
      {
        ruleId: BigInt(1),
        userId: BigInt(1),
        isActive: true,
        priority: 1,
        merchantContains: "UBER",
        merchantEquals: null,
        minAmount: null,
        maxAmount: null,
        transactionType: null,
        spendCategory: SpendCategory.TRAVEL,
      },
      {
        ruleId: BigInt(2),
        userId: BigInt(1),
        isActive: true,
        priority: 2,
        merchantContains: "UBER",
        merchantEquals: null,
        minAmount: null,
        maxAmount: null,
        transactionType: null,
        spendCategory: SpendCategory.TRANSPORTATION,
      },
    ]);

    const result = await service.evaluate({
      userId: BigInt(1),
      description: "UBER TRIP",
      amount: new Prisma.Decimal("12"),
      transactionType: TransactionType.DEBIT,
    });

    expect(result).toBe(SpendCategory.TRAVEL);
  });

  it("should return null when no rules match", async () => {
    mockPrisma.userCategoryRule.findMany.mockResolvedValue([
      {
        ruleId: BigInt(1),
        userId: BigInt(1),
        isActive: true,
        priority: 1,
        merchantContains: "NETFLIX",
        merchantEquals: null,
        minAmount: null,
        maxAmount: null,
        transactionType: null,
        spendCategory: SpendCategory.ENTERTAINMENT,
      },
    ]);

    const result = await service.evaluate({
      userId: BigInt(1),
      description: "UBER TRIP",
      amount: new Prisma.Decimal("12"),
      transactionType: TransactionType.DEBIT,
    });

    expect(result).toBeNull();
  });

  it("should reapply rules only to uncategorized transactions and update matched ones", async () => {
    mockPrisma.transaction.findMany.mockResolvedValue([
      {
        transactionId: BigInt(101),
        userId: BigInt(1),
        description: "UBER TRIP",
        amount: new Prisma.Decimal("15"),
        transactionType: TransactionType.DEBIT,
        spendCategory: SpendCategory.UNCATEGORIZED,
      },
      {
        transactionId: BigInt(102),
        userId: BigInt(1),
        description: "STARBUCKS #123",
        amount: new Prisma.Decimal("7"),
        transactionType: TransactionType.DEBIT,
        spendCategory: SpendCategory.UNCATEGORIZED,
      },
    ]);

    mockPrisma.userCategoryRule.findMany
      .mockResolvedValueOnce([
        {
          ruleId: BigInt(1),
          userId: BigInt(1),
          isActive: true,
          priority: 1,
          merchantContains: "UBER",
          merchantEquals: null,
          minAmount: null,
          maxAmount: null,
          transactionType: null,
          spendCategory: SpendCategory.TRANSPORTATION,
        },
      ])
      .mockResolvedValueOnce([
        {
          ruleId: BigInt(2),
          userId: BigInt(1),
          isActive: true,
          priority: 1,
          merchantContains: "STARBUCKS",
          merchantEquals: null,
          minAmount: null,
          maxAmount: null,
          transactionType: null,
          spendCategory: SpendCategory.FOOD_AND_DINING,
        },
      ]);

    await service.reapplyRulesToExistingTransactions(BigInt(1));

    expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
      where: {
        userId: BigInt(1),
        spendCategory: "UNCATEGORIZED",
      },
      orderBy: [{ transactionId: "asc" }],
    });

    expect(mockPrisma.transaction.update).toHaveBeenCalledTimes(2);
    expect(mockPrisma.transaction.update).toHaveBeenNthCalledWith(1, {
      where: { transactionId: BigInt(101) },
      data: { spendCategory: SpendCategory.TRANSPORTATION },
    });
    expect(mockPrisma.transaction.update).toHaveBeenNthCalledWith(2, {
      where: { transactionId: BigInt(102) },
      data: { spendCategory: SpendCategory.FOOD_AND_DINING },
    });
  });
});