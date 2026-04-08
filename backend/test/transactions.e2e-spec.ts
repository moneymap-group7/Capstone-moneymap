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

describe("Transactions E2E", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const email = "transactions.e2e.moneymap@example.com";
  const otherEmail = "transactions.other.e2e.moneymap@example.com";
  const password = "Test@1234";

  let token: string;
  let userId: string;
  let tx1Id: string;
  let tx2Id: string;
  let tx3Id: string;

  let otherToken: string;
  let otherUserId: string;
  let otherTxId: string;

  async function registerVerifyLogin(targetEmail: string) {
    await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        fullName:
          targetEmail === email
            ? "Transactions E2E User"
            : "Transactions Other E2E User",
        email: targetEmail,
        password,
      })
      .expect(201);

    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
      select: {
        userId: true,
        emailVerificationCode: true,
      },
    });

    expect(user).toBeTruthy();
    expect(user?.emailVerificationCode).toBeTruthy();

    await request(app.getHttpServer())
      .post("/auth/verify-email")
      .send({
        email: targetEmail,
        code: user!.emailVerificationCode,
      })
      .expect(201);

    const loginRes = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email: targetEmail,
        password,
      })
      .expect(200);

    return {
      userId: user!.userId.toString(),
      token: loginRes.body.accessToken as string,
    };
  }

  async function seedTransactions() {
    const uid = BigInt(userId);

    const created = await Promise.all([
      prisma.transaction.create({
        data: {
          userId: uid,
          transactionDate: new Date("2026-02-02T00:00:00.000Z"),
          description: "UBER CANADA/UBERTRIP TORONTO, ON",
          amount: new Prisma.Decimal(-15.38),
          currency: "CAD",
          transactionType: TransactionType.DEBIT,
          source: TransactionSource.CSV,
          spendCategory: SpendCategory.TRANSPORTATION,
          cardLast4: "9691",
        },
      }),
      prisma.transaction.create({
        data: {
          userId: uid,
          transactionDate: new Date("2026-02-03T00:00:00.000Z"),
          description: "WALMART.CA MISSISSAUGA, ON",
          amount: new Prisma.Decimal(-30.48),
          currency: "CAD",
          transactionType: TransactionType.DEBIT,
          source: TransactionSource.CSV,
          spendCategory: SpendCategory.GROCERIES,
          cardLast4: "9691",
        },
      }),
      prisma.transaction.create({
        data: {
          userId: uid,
          transactionDate: new Date("2026-02-10T00:00:00.000Z"),
          description: "PAYROLL DEPOSIT",
          amount: new Prisma.Decimal(2000.0),
          currency: "CAD",
          transactionType: TransactionType.CREDIT,
          source: TransactionSource.CSV,
          spendCategory: SpendCategory.INCOME,
          cardLast4: "9691",
        },
      }),
    ]);

    tx1Id = created[0].transactionId.toString();
    tx2Id = created[1].transactionId.toString();
    tx3Id = created[2].transactionId.toString();
  }

  async function seedOtherUserTransaction() {
    const created = await prisma.transaction.create({
      data: {
        userId: BigInt(otherUserId),
        transactionDate: new Date("2026-02-05T00:00:00.000Z"),
        description: "OTHER USER COFFEE SHOP",
        amount: new Prisma.Decimal(-9.99),
        currency: "CAD",
        transactionType: TransactionType.DEBIT,
        source: TransactionSource.CSV,
        spendCategory: SpendCategory.FOOD_AND_DINING,
        cardLast4: "1234",
      },
    });

    otherTxId = created.transactionId.toString();
  }

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;

    await cleanupAuthUser(prisma, email);
    await cleanupAuthUser(prisma, otherEmail);

    const primary = await registerVerifyLogin(email);
    userId = primary.userId;
    token = primary.token;

    const secondary = await registerVerifyLogin(otherEmail);
    otherUserId = secondary.userId;
    otherToken = secondary.token;

    await seedTransactions();
    await seedOtherUserTransaction();
  });

  afterAll(async () => {
    await cleanupAuthUser(prisma, email);
    await cleanupAuthUser(prisma, otherEmail);
    await closeTestApp(app, prisma);
  });

  it("GET /transactions should reject missing token", async () => {
    await request(app.getHttpServer()).get("/transactions").expect(401);
  });

  it("GET /transactions should list transactions for authenticated user", async () => {
    const res = await request(app.getHttpServer())
      .get("/transactions")
      .set("Authorization", `Bearer ${token}`)
      .query({
        page: "1",
        pageSize: "10",
      })
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.pageSize).toBe(10);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(3);
  });

  it("GET /transactions should support filtering by query text", async () => {
    const res = await request(app.getHttpServer())
      .get("/transactions")
      .set("Authorization", `Bearer ${token}`)
      .query({
        q: "UBER",
      })
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(
      res.body.data.some((t: any) =>
        String(t.description).toUpperCase().includes("UBER"),
      ),
    ).toBe(true);
  });

  it("GET /transactions should support filtering by transaction type", async () => {
    const res = await request(app.getHttpServer())
      .get("/transactions")
      .set("Authorization", `Bearer ${token}`)
      .query({
        type: "CREDIT",
      })
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.every((t: any) => t.transactionType === "CREDIT")).toBe(
      true,
    );
  });

  it("GET /transactions/:id should return a single transaction for the authenticated user", async () => {
    const res = await request(app.getHttpServer())
      .get(`/transactions/${tx1Id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body.transactionId).toBe(tx1Id);
    expect(res.body.description).toContain("UBER");
  });

  it("GET /transactions/:id should reject access to another user's transaction", async () => {
    await request(app.getHttpServer())
      .get(`/transactions/${otherTxId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(403);
  });

  it("PATCH /transactions/:id/category should update a transaction category", async () => {
    const res = await request(app.getHttpServer())
      .patch(`/transactions/${tx1Id}/category`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        spendCategory: SpendCategory.FOOD_AND_DINING,
      })
      .expect(200);

    expect(res.body.message).toBe("Transaction updated successfully");
    expect(res.body.data.transactionId).toBe(tx1Id);
    expect(res.body.data.spendCategory).toBe(SpendCategory.FOOD_AND_DINING);
  });

  it("PATCH /transactions/:id/category should reject invalid category", async () => {
    const res = await request(app.getHttpServer())
      .patch(`/transactions/${tx1Id}/category`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        spendCategory: "NOT_A_REAL_CATEGORY",
      })
      .expect(400);

    expect(Array.isArray(res.body.message)).toBe(true);
    expect(
      res.body.message.some((msg: string) => msg.includes("Invalid option")),
    ).toBe(true);
  });

  it("PATCH /transactions/:id/category should reject updating another user's transaction", async () => {
    await request(app.getHttpServer())
      .patch(`/transactions/${otherTxId}/category`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        spendCategory: SpendCategory.OTHER,
      })
      .expect(403);
  });

  it("PATCH /transactions/:id should update category through alternate endpoint", async () => {
    const res = await request(app.getHttpServer())
      .patch(`/transactions/${tx1Id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        spendCategory: SpendCategory.TRANSPORTATION,
      })
      .expect(200);

    expect(res.body.message).toBe("Transaction updated successfully");
    expect(res.body.data.transactionId).toBe(tx1Id);
    expect(res.body.data.spendCategory).toBe(SpendCategory.TRANSPORTATION);
  });

  it("PATCH /transactions/:id should reject invalid category through alternate endpoint", async () => {
    const res = await request(app.getHttpServer())
      .patch(`/transactions/${tx1Id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        spendCategory: "BAD_CATEGORY",
      })
      .expect(400);

    expect(res.body.message).toContain("Invalid spendCategory");
  });

  it("PATCH /transactions/:id should reject updating another user's transaction", async () => {
    await request(app.getHttpServer())
      .patch(`/transactions/${otherTxId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        spendCategory: SpendCategory.OTHER,
      })
      .expect(403);
  });

  it("PATCH /transactions/bulk-category should update multiple transactions", async () => {
    const res = await request(app.getHttpServer())
      .patch("/transactions/bulk-category")
      .set("Authorization", `Bearer ${token}`)
      .send({
        transactionIds: [tx1Id, tx2Id],
        spendCategory: SpendCategory.OTHER,
      })
      .expect(200);

    expect(res.body.message).toBe("Transactions updated successfully");
    expect(res.body.updatedCount).toBe(2);

    const updated = await prisma.transaction.findMany({
      where: {
        transactionId: { in: [BigInt(tx1Id), BigInt(tx2Id)] },
      },
      select: {
        transactionId: true,
        spendCategory: true,
      },
    });

    expect(updated).toHaveLength(2);
    expect(updated.every((t) => t.spendCategory === SpendCategory.OTHER)).toBe(
      true,
    );
  });

  it("PATCH /transactions/bulk-category should reject invalid category", async () => {
    const res = await request(app.getHttpServer())
      .patch("/transactions/bulk-category")
      .set("Authorization", `Bearer ${token}`)
      .send({
        transactionIds: [tx1Id, tx2Id],
        spendCategory: "NOT_VALID",
      })
      .expect(400);

    expect(res.body.message).toContain("Invalid spendCategory");
  });

  it("PATCH /transactions/bulk-category should not update another user's transactions", async () => {
    const res = await request(app.getHttpServer())
      .patch("/transactions/bulk-category")
      .set("Authorization", `Bearer ${token}`)
      .send({
        transactionIds: [otherTxId],
        spendCategory: SpendCategory.OTHER,
      })
      .expect(200);

    expect(res.body.message).toBe("Transactions updated successfully");
    expect(res.body.updatedCount).toBe(0);

    const unchanged = await prisma.transaction.findUnique({
      where: { transactionId: BigInt(otherTxId) },
      select: { spendCategory: true },
    });

    expect(unchanged?.spendCategory).toBe(SpendCategory.FOOD_AND_DINING);
  });

  it("GET /transactions/export/csv should export csv for authenticated user", async () => {
    const res = await request(app.getHttpServer())
      .get("/transactions/export/csv")
      .set("Authorization", `Bearer ${token}`)
      .query({
        month: "2026-02",
      })
      .expect(200);

    expect(res.headers["content-type"]).toContain("text/csv");
    expect(String(res.text)).toContain("transactionId");
    expect(String(res.text)).toContain("description");
  });

  it("DELETE /transactions/bulk should delete selected transactions", async () => {
    const res = await request(app.getHttpServer())
      .delete("/transactions/bulk")
      .set("Authorization", `Bearer ${token}`)
      .send({
        transactionIds: [tx2Id, tx3Id],
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.deletedCount).toBe(2);

    const remaining = await prisma.transaction.findMany({
      where: {
        transactionId: { in: [BigInt(tx2Id), BigInt(tx3Id)] },
      },
    });

    expect(remaining).toHaveLength(0);
  });

  it("DELETE /transactions/bulk should not delete another user's transactions", async () => {
    const res = await request(app.getHttpServer())
      .delete("/transactions/bulk")
      .set("Authorization", `Bearer ${token}`)
      .send({
        transactionIds: [otherTxId],
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.deletedCount).toBe(0);

    const stillExists = await prisma.transaction.findUnique({
      where: { transactionId: BigInt(otherTxId) },
    });

    expect(stillExists).toBeTruthy();
  });

  it("GET /transactions/:id should return 404 for deleted transaction", async () => {
    await request(app.getHttpServer())
      .get(`/transactions/${tx2Id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(404);
  });
});