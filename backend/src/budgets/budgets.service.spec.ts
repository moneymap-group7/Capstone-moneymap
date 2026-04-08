import { describe, beforeEach, it, expect, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { SpendCategory } from "@prisma/client";
import { BudgetsService } from "./budgets.service";
import { PrismaService } from "../prisma/prisma.service";

describe("BudgetsService", () => {
  let service: BudgetsService;

  const prismaMock = {
    budget: {
      findFirst: jest.fn<any>(),
      findMany: jest.fn<any>(),
      create: jest.fn<any>(),
      update: jest.fn<any>(),
      delete: jest.fn<any>(),
      deleteMany: jest.fn<any>(),
    },
    $transaction: jest.fn<any>(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    prismaMock.$transaction.mockImplementation(async (cb: any) => cb(prismaMock));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<BudgetsService>(BudgetsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("create should reject invalid startDate", async () => {
    await expect(
      service.create(BigInt(1), {
        name: "Groceries",
        amount: 300,
        spendCategory: SpendCategory.GROCERIES,
        startDate: "not-a-date",
        isActive: true,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("create should update same-start existing budget instead of creating duplicate", async () => {
    const userId = BigInt(1);
    const sameStartBudget = {
      budgetId: BigInt(10),
    };

    prismaMock.budget.findFirst.mockResolvedValueOnce(sameStartBudget);
    prismaMock.budget.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.budget.update.mockResolvedValue({
      budgetId: BigInt(10),
      name: "Groceries Updated",
      spendCategory: SpendCategory.GROCERIES,
    });

    const result = await service.create(userId, {
      name: "Groceries Updated",
      amount: 500,
      spendCategory: SpendCategory.GROCERIES,
      startDate: "2026-02-15T00:00:00.000Z",
      isActive: true,
    });

    expect(prismaMock.budget.update).toHaveBeenCalled();
    expect(prismaMock.budget.create).not.toHaveBeenCalled();
    expect(result.budgetId).toBe(BigInt(10));
  });

  it("create should close previous active budget and create a new one", async () => {
    const userId = BigInt(1);

    prismaMock.budget.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        budgetId: BigInt(5),
        startDate: new Date("2026-01-01T00:00:00.000Z"),
      });

    prismaMock.budget.update.mockResolvedValue({});
    prismaMock.budget.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.budget.create.mockResolvedValue({
      budgetId: BigInt(11),
      name: "Transport",
      spendCategory: SpendCategory.TRANSPORTATION,
    });

    const result = await service.create(userId, {
      name: "Transport",
      amount: 200,
      spendCategory: SpendCategory.TRANSPORTATION,
      startDate: "2026-03-10T00:00:00.000Z",
      isActive: true,
    });

    expect(prismaMock.budget.update).toHaveBeenCalled();
    expect(prismaMock.budget.create).toHaveBeenCalled();
    expect(result.budgetId).toBe(BigInt(11));
  });

  it("findAll should return budgets ordered by startDate desc and spendCategory asc", async () => {
    prismaMock.budget.findMany.mockResolvedValue([
      { budgetId: BigInt(1) },
      { budgetId: BigInt(2) },
    ]);

    const result = await service.findAll(BigInt(1));

    expect(prismaMock.budget.findMany).toHaveBeenCalledWith({
      where: { userId: BigInt(1) },
      orderBy: [{ startDate: "desc" }, { spendCategory: "asc" }],
    });
    expect(result).toHaveLength(2);
  });

  it("findOne should throw NotFoundException when budget is missing", async () => {
    prismaMock.budget.findFirst.mockResolvedValue(null);

    await expect(service.findOne(BigInt(1), BigInt(999))).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("update should delete old budget and recreate with merged values", async () => {
    const userId = BigInt(1);

    jest.spyOn(service, "findOne").mockResolvedValue({
      budgetId: BigInt(8),
      userId,
      name: "Old Name",
      amount: 300,
      spendCategory: SpendCategory.GROCERIES,
      startDate: new Date("2026-02-01T00:00:00.000Z"),
      endDate: new Date("2027-01-31T23:59:59.999Z"),
      isActive: true,
    } as any);

    prismaMock.budget.delete.mockResolvedValue({});

    jest.spyOn(service, "create").mockResolvedValue({
      budgetId: BigInt(9),
      name: "New Name",
      spendCategory: SpendCategory.GROCERIES,
    } as any);

    const result = await service.update(userId, BigInt(8), {
      name: "New Name",
    });

    expect(prismaMock.budget.delete).toHaveBeenCalledWith({
      where: { budgetId: BigInt(8) },
    });
    expect(service.create).toHaveBeenCalled();
    expect(result.budgetId).toBe(BigInt(9));
  });

  it("remove should return success true after deletion", async () => {
    const userId = BigInt(1);

    jest.spyOn(service, "findOne").mockResolvedValue({
      budgetId: BigInt(20),
      userId,
      spendCategory: SpendCategory.GROCERIES,
      startDate: new Date("2026-03-01T00:00:00.000Z"),
    } as any);

    prismaMock.budget.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    prismaMock.budget.delete.mockResolvedValue({});

    const result = await service.remove(userId, BigInt(20));

    expect(prismaMock.budget.delete).toHaveBeenCalledWith({
      where: { budgetId: BigInt(20) },
    });
    expect(result).toEqual({ success: true });
  });

  it("remove should repair previous budget endDate when previous budget exists", async () => {
    const userId = BigInt(1);

    jest.spyOn(service, "findOne").mockResolvedValue({
      budgetId: BigInt(20),
      userId,
      spendCategory: SpendCategory.GROCERIES,
      startDate: new Date("2026-03-01T00:00:00.000Z"),
    } as any);

    prismaMock.budget.findFirst
      .mockResolvedValueOnce({
        budgetId: BigInt(19),
        startDate: new Date("2026-02-01T00:00:00.000Z"),
      })
      .mockResolvedValueOnce(null);

    prismaMock.budget.delete.mockResolvedValue({});
    prismaMock.budget.update.mockResolvedValue({});

    const result = await service.remove(userId, BigInt(20));

    expect(prismaMock.budget.update).toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });
});
