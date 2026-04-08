/// <reference types="jest" />

import request from "supertest";
import { INestApplication } from "@nestjs/common";
import {
  Prisma,
  SpendCategory,
  TransactionSource,
  TransactionType,
} from "@prisma/client";
import { PrismaService } from "../src/prisma/prisma.service";
import {
  cleanupAuthUser,
  closeTestApp,
  createTestApp,
} from "./test-helpers";

describe("Budgets E2E", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const email = "budgets.e2e.moneymap@example.com";
  const password = "Test@1234";
  let token: string;
  let userId: string;
  let createdBudgetId: string;

  async function registerVerifyLogin() {
    await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        fullName: "Budgets E2E User",
        email,
        password,
      })
      .expect(201);

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        userId: true,
        emailVerificationCode: true,
      },
    });

    expect(user).toBeTruthy();
    expect(user?.emailVerificationCode).toBeTruthy();

    userId = user!.userId.toString();

    await request(app.getHttpServer())
      .post("/auth/verify-email")
      .send({
        email,
        code: user!.emailVerificationCode,
      })
      .expect(201);

    const loginRes = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email,
        password,
      })
      .expect(200);

    token = loginRes.body.accessToken;
  }

  async function seedBudgetTransactions() {
    const uid = BigInt(userId);

    await prisma.transaction.createMany({
      data: [
        {
          userId: uid,
          transactionDate: new Date("2026-02-02T00:00:00.000Z"),
          description: "WALMART.CA MISSISSAUGA, ON",
          amount: new Prisma.Decimal(-40.0),
          currency: "CAD",
          transactionType: TransactionType.DEBIT,
          source: TransactionSource.CSV,
          spendCategory: SpendCategory.GROCERIES,
        },
        {
          userId: uid,
          transactionDate: new Date("2026-02-10T00:00:00.000Z"),
          description: "FARAH MARKET EXPRESS WATERLOO, ON",
          amount: new Prisma.Decimal(-60.0),
          currency: "CAD",
          transactionType: TransactionType.DEBIT,
          source: TransactionSource.CSV,
          spendCategory: SpendCategory.GROCERIES,
        },
        {
          userId: uid,
          transactionDate: new Date("2026-02-15T00:00:00.000Z"),
          description: "UBER CANADA/UBERTRIP TORONTO, ON",
          amount: new Prisma.Decimal(-25.0),
          currency: "CAD",
          transactionType: TransactionType.DEBIT,
          source: TransactionSource.CSV,
          spendCategory: SpendCategory.TRANSPORTATION,
        },
        {
          userId: uid,
          transactionDate: new Date("2026-01-20T00:00:00.000Z"),
          description: "WALMART.CA MISSISSAUGA, ON",
          amount: new Prisma.Decimal(-20.0),
          currency: "CAD",
          transactionType: TransactionType.DEBIT,
          source: TransactionSource.CSV,
          spendCategory: SpendCategory.GROCERIES,
        },
      ],
    });
  }

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;

    await cleanupAuthUser(prisma, email);
    await registerVerifyLogin();
    await seedBudgetTransactions();
  });

  afterAll(async () => {
    await cleanupAuthUser(prisma, email);
    await closeTestApp(app, prisma);
  });

  it("POST /budgets should create a budget", async () => {
    const res = await request(app.getHttpServer())
      .post("/budgets")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Groceries February Budget",
        amount: 200,
        spendCategory: SpendCategory.GROCERIES,
        startDate: "2026-02-01T00:00:00.000Z",
        isActive: true,
      })
      .expect(201);

    expect(res.body).toHaveProperty("budgetId");
    expect(res.body.name).toBe("Groceries February Budget");
    expect(res.body.spendCategory).toBe(SpendCategory.GROCERIES);

    createdBudgetId = res.body.budgetId;
  });

  it("GET /budgets should list budgets for the authenticated user", async () => {
    const res = await request(app.getHttpServer())
      .get("/budgets")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const createdBudget = res.body.find((b: any) => b.budgetId === createdBudgetId);
    expect(createdBudget).toBeTruthy();
    expect(createdBudget.spendCategory).toBe(SpendCategory.GROCERIES);
  });

  it("GET /budgets/:id should return the created budget", async () => {
    const res = await request(app.getHttpServer())
      .get(`/budgets/${createdBudgetId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body.budgetId).toBe(createdBudgetId);
    expect(res.body.name).toBe("Groceries February Budget");
    expect(res.body.spendCategory).toBe(SpendCategory.GROCERIES);
  });

  it("PATCH /budgets/:id should update the created budget", async () => {
    const res = await request(app.getHttpServer())
      .patch(`/budgets/${createdBudgetId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Groceries Updated Budget",
        amount: 250,
        spendCategory: SpendCategory.GROCERIES,
        startDate: "2026-02-01T00:00:00.000Z",
        isActive: true,
      })
      .expect(200);

    expect(res.body.name).toBe("Groceries Updated Budget");
    expect(String(res.body.amount)).toBe("250");
    expect(res.body.spendCategory).toBe(SpendCategory.GROCERIES);

    createdBudgetId = res.body.budgetId;
  });

  it("GET /budgets/utilization should return utilization rows and alerts", async () => {
    const res = await request(app.getHttpServer())
      .get("/budgets/utilization")
      .set("Authorization", `Bearer ${token}`)
      .query({
        start: "2026-02-01",
        end: "2026-02-28",
      })
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(Array.isArray(res.body.alerts)).toBe(true);

    const groceries = res.body.data.find(
      (x: any) => x.spendCategory === SpendCategory.GROCERIES,
    );

    expect(groceries).toBeTruthy();
    expect(groceries.budgetLimit).toBe(250);
    expect(groceries.currentSpend).toBe(100);
    expect(groceries.utilizationPercent).toBe(40);
    expect(groceries.remainingAmount).toBe(150);
  });

  it("GET /budgets/utilization/compare should compare current and previous period spending", async () => {
    const res = await request(app.getHttpServer())
      .get("/budgets/utilization/compare")
      .set("Authorization", `Bearer ${token}`)
      .query({
        start: "2026-02-01",
        end: "2026-02-28",
      })
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);

    const groceries = res.body.data.find(
      (x: any) => x.spendCategory === SpendCategory.GROCERIES,
    );

    expect(groceries).toBeTruthy();
    expect(groceries.currentSpend).toBe(100);
    expect(groceries.previousSpend).toBe(0);
    expect(groceries.difference).toBe(100);
    expect(groceries.percentChange).toBe(100);
  });

  it("DELETE /budgets/:id should remove the budget", async () => {
    const res = await request(app.getHttpServer())
      .delete(`/budgets/${createdBudgetId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);

    await request(app.getHttpServer())
      .get(`/budgets/${createdBudgetId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(404);
  });
});