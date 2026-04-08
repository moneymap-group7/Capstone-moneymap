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

describe("Analytics E2E", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const email = "analytics.e2e.moneymap@example.com";
  const password = "Test@1234";
  let token: string;
  let userId: string;

  async function registerVerifyLogin() {
    await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        fullName: "Analytics E2E User",
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

  async function seedAnalyticsTransactions() {
    const uid = BigInt(userId);

    await prisma.transaction.createMany({
      data: [
        {
          userId: uid,
          transactionDate: new Date("2026-02-02T00:00:00.000Z"),
          description: "UBER CANADA/UBERTRIP TORONTO, ON",
          amount: new Prisma.Decimal(-15.38),
          currency: "CAD",
          transactionType: TransactionType.DEBIT,
          source: TransactionSource.CSV,
          spendCategory: SpendCategory.TRANSPORTATION,
        },
        {
          userId: uid,
          transactionDate: new Date("2026-02-03T00:00:00.000Z"),
          description: "WALMART.CA MISSISSAUGA, ON",
          amount: new Prisma.Decimal(-30.48),
          currency: "CAD",
          transactionType: TransactionType.DEBIT,
          source: TransactionSource.CSV,
          spendCategory: SpendCategory.GROCERIES,
        },
        {
          userId: uid,
          transactionDate: new Date("2026-02-03T00:00:00.000Z"),
          description: "GINO'S PIZZA #85 WATERLOO, ON",
          amount: new Prisma.Decimal(-26.0),
          currency: "CAD",
          transactionType: TransactionType.DEBIT,
          source: TransactionSource.CSV,
          spendCategory: SpendCategory.FOOD_AND_DINING,
        },
        {
          userId: uid,
          transactionDate: new Date("2026-02-10T00:00:00.000Z"),
          description: "PAYROLL DEPOSIT",
          amount: new Prisma.Decimal(2000.0),
          currency: "CAD",
          transactionType: TransactionType.CREDIT,
          source: TransactionSource.CSV,
          spendCategory: SpendCategory.INCOME,
        },
        {
          userId: uid,
          transactionDate: new Date("2026-01-05T00:00:00.000Z"),
          description: "ROGERS COMMUNICATIONS TORONTO, ON",
          amount: new Prisma.Decimal(-55.0),
          currency: "CAD",
          transactionType: TransactionType.DEBIT,
          source: TransactionSource.CSV,
          spendCategory: SpendCategory.UTILITIES,
        },
        {
          userId: uid,
          transactionDate: new Date("2026-02-05T00:00:00.000Z"),
          description: "ROGERS COMMUNICATIONS TORONTO, ON",
          amount: new Prisma.Decimal(-55.0),
          currency: "CAD",
          transactionType: TransactionType.DEBIT,
          source: TransactionSource.CSV,
          spendCategory: SpendCategory.UTILITIES,
        },
        {
          userId: uid,
          transactionDate: new Date("2026-03-05T00:00:00.000Z"),
          description: "ROGERS COMMUNICATIONS TORONTO, ON",
          amount: new Prisma.Decimal(-55.0),
          currency: "CAD",
          transactionType: TransactionType.DEBIT,
          source: TransactionSource.CSV,
          spendCategory: SpendCategory.UTILITIES,
        }
      ],
    });
  }

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;

    await cleanupAuthUser(prisma, email);
    await registerVerifyLogin();
    await seedAnalyticsTransactions();
  });

  afterAll(async () => {
    await cleanupAuthUser(prisma, email);
    await closeTestApp(app, prisma);
  });

  it("GET /analytics/summary should return correct totals", async () => {
    const res = await request(app.getHttpServer())
      .get("/analytics/summary")
      .set("Authorization", `Bearer ${token}`)
      .query({
        start: "2026-02-01",
        end: "2026-02-28",
      })
      .expect(200);

    expect(res.body.totalIncome).toBe("2000.00");
    expect(res.body.totalExpense).toBe("126.86");
    expect(res.body.net).toBe("1873.14");

    const categories = res.body.byCategory.map((x: any) => x.spendCategory);
    expect(categories).toContain(SpendCategory.TRANSPORTATION);
    expect(categories).toContain(SpendCategory.GROCERIES);
    expect(categories).toContain(SpendCategory.FOOD_AND_DINING);
    expect(categories).toContain(SpendCategory.UTILITIES);
  });

  it("GET /analytics/by-category should return grouped debit totals and counts", async () => {
    const res = await request(app.getHttpServer())
      .get("/analytics/by-category")
      .set("Authorization", `Bearer ${token}`)
      .query({
        start: "2026-02-01",
        end: "2026-02-28",
      })
      .expect(200);

    expect(Array.isArray(res.body.items)).toBe(true);

    const groceries = res.body.items.find(
      (x: any) => x.spendCategory === SpendCategory.GROCERIES,
    );
    const transport = res.body.items.find(
      (x: any) => x.spendCategory === SpendCategory.TRANSPORTATION,
    );

    expect(groceries).toBeTruthy();
    expect(groceries.total).toBe("30.48");
    expect(groceries.count).toBe(1);

    expect(transport).toBeTruthy();
    expect(transport.total).toBe("15.38");
    expect(transport.count).toBe(1);
  });

  it("GET /analytics/top-merchants should return normalized top merchants", async () => {
    const res = await request(app.getHttpServer())
      .get("/analytics/top-merchants")
      .set("Authorization", `Bearer ${token}`)
      .query({
        start: "2026-01-01",
        end: "2026-03-31",
        limit: "5",
      })
      .expect(200);

    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.limit).toBe(5);

    const merchants = res.body.items.map((x: any) => x.merchant);
    expect(merchants).toContain("ROGERS");
    expect(merchants).toContain("WALMART");
    expect(merchants).toContain("UBER");
  });

  it("GET /analytics/aggregation should return correct range totals and transaction count", async () => {
    const res = await request(app.getHttpServer())
      .get("/analytics/aggregation")
      .set("Authorization", `Bearer ${token}`)
      .query({
        start: "2026-02-01",
        end: "2026-02-28",
      })
      .expect(200);

    expect(res.body.range.start).toBe("2026-02-01");
    expect(res.body.range.end).toBe("2026-02-28");
    expect(res.body.totals.totalSpent).toBe("126.86");
    expect(res.body.totals.transactionCount).toBe(4);
    expect(Array.isArray(res.body.rows)).toBe(true);
  });

  it("GET /analytics/monthly should return monthly rollup and category monthly data", async () => {
    const res = await request(app.getHttpServer())
      .get("/analytics/monthly")
      .set("Authorization", `Bearer ${token}`)
      .query({
        start: "2026-01-01",
        end: "2026-03-31",
        includeCategoryMonthly: "true",
      })
      .expect(200);

    expect(Array.isArray(res.body.monthly)).toBe(true);
    expect(res.body.monthly.length).toBeGreaterThanOrEqual(3);
    expect(Array.isArray(res.body.byCategoryMonthly)).toBe(true);

    const feb = res.body.monthly.find((x: any) => x.month === "2026-02");
    expect(feb).toBeTruthy();
    expect(feb.income).toBe("2000.00");
    expect(feb.expense).toBe("126.86");
  });

  it("GET /analytics/recurring should detect monthly recurring merchants", async () => {
    const res = await request(app.getHttpServer())
      .get("/analytics/recurring")
      .set("Authorization", `Bearer ${token}`)
      .query({
        months: "6",
        end: "2026-03-31",
      })
      .expect(200);

    expect(Array.isArray(res.body.items)).toBe(true);

    const rogers = res.body.items.find((x: any) => x.merchant === "ROGERS");
    expect(rogers).toBeTruthy();
    expect(rogers.cadence).toBe("MONTHLY");
    expect(rogers.occurrences).toBe(3);
    expect(rogers.avgAmount).toBe("55.00");
  });
});
