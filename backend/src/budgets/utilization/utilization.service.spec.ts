import { Test, TestingModule } from "@nestjs/testing";
import { UtilizationService } from "./utilization.service";
import { PrismaService } from "../../prisma/prisma.service";
import { AlertsService } from "../../common/alerts/alerts.service";
import { SpendCategory } from "@prisma/client";

jest.setTimeout(20000);

describe("UtilizationService", () => {
  let service: UtilizationService;

  const prismaMock = {
    budget: { findMany: jest.fn() },
    transaction: {
      groupBy: jest.fn(), // ✅ IMPORTANT
    },
  };

  const alertsMock: any = {
    evaluate: jest.fn().mockResolvedValue([]),
    evaluateAlerts: jest.fn().mockResolvedValue([]),
    buildAlerts: jest.fn().mockResolvedValue([]),
    getAlertsForUtilization: jest.fn().mockResolvedValue([]),
    run: jest.fn().mockResolvedValue([]),
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UtilizationService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AlertsService, useValue: alertsMock },
      ],
    }).compile();

    service = moduleRef.get(UtilizationService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns empty when there are no budgets", async () => {
    const userId = BigInt(3);
    const start = new Date("2026-02-01T00:00:00.000Z");
    const end = new Date("2026-02-28T23:59:59.999Z");

    prismaMock.budget.findMany.mockResolvedValue([]);
    prismaMock.transaction.groupBy.mockResolvedValue([]);

    const result: any = await service.getUtilizationForRange(userId, start, end);

    const rows = Array.isArray(result) ? result : result.data;
    expect(rows).toEqual([]);
  });

  it("returns zero spend if no matching categorized spend exists", async () => {
    const userId = BigInt(3);
    const start = new Date("2026-02-01T00:00:00.000Z");
    const end = new Date("2026-02-28T23:59:59.999Z");

    prismaMock.budget.findMany.mockResolvedValue([
      {
        budgetId: BigInt(1),
        userId,
        name: "Groceries Feb",
        amount: 400,
        spendCategory: SpendCategory.GROCERIES,
        startDate: start,
        endDate: end,
        isActive: true,
      },
    ]);

    // No spend aggregated
    prismaMock.transaction.groupBy.mockResolvedValue([]);

    const result: any = await service.getUtilizationForRange(userId, start, end);
    const rows = Array.isArray(result) ? result : result.data;

    const row = rows.find((r: any) => r.spendCategory === "GROCERIES");
    expect(row).toBeDefined();
    expect(row.currentSpend).toBe(0);
    expect(row.utilizationPercent).toBe(0);
    expect(row.remainingAmount).toBe(400);
  });

  it("handles zero budget safely (no divide-by-zero)", async () => {
    const userId = BigInt(3);
    const start = new Date("2026-02-01T00:00:00.000Z");
    const end = new Date("2026-02-28T23:59:59.999Z");

    prismaMock.budget.findMany.mockResolvedValue([
      {
        budgetId: BigInt(2),
        userId,
        name: "Transport Feb",
        amount: 0,
        spendCategory: SpendCategory.TRANSPORTATION,
        startDate: start,
        endDate: end,
        isActive: true,
      },
    ]);

    prismaMock.transaction.groupBy.mockResolvedValue([
      { spendCategory: SpendCategory.TRANSPORTATION, _sum: { amount: 12.5 } },
    ]);

    const result: any = await service.getUtilizationForRange(userId, start, end);
    const rows = Array.isArray(result) ? result : result.data;

    const row = rows.find((r: any) => r.spendCategory === "TRANSPORTATION");
    expect(row).toBeDefined();
    expect(row.budgetLimit).toBe(0);
    expect(row.currentSpend).toBeCloseTo(12.5, 2);
    expect(Number.isFinite(row.utilizationPercent)).toBe(true);
  });

  it("sums spend correctly for a category", async () => {
    const userId = BigInt(3);
    const start = new Date("2026-02-01T00:00:00.000Z");
    const end = new Date("2026-02-28T23:59:59.999Z");

    prismaMock.budget.findMany.mockResolvedValue([
      {
        budgetId: BigInt(3),
        userId,
        name: "Groceries Feb",
        amount: 400,
        spendCategory: SpendCategory.GROCERIES,
        startDate: start,
        endDate: end,
        isActive: true,
      },
    ]);

    prismaMock.transaction.groupBy.mockResolvedValue([
      { spendCategory: SpendCategory.GROCERIES, _sum: { amount: 108.35 } },
    ]);

    const result: any = await service.getUtilizationForRange(userId, start, end);
    const rows = Array.isArray(result) ? result : result.data;

    const row = rows.find((r: any) => r.spendCategory === "GROCERIES");
    expect(row).toBeDefined();
    expect(row.currentSpend).toBeCloseTo(108.35, 2);
    expect(row.remainingAmount).toBeCloseTo(291.65, 2);
  });
});