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

describe("Rules E2E", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const userAEmail = "rules.usera@example.com";
  const userBEmail = "rules.userb@example.com";
  const password = "Test@1234";

  let userAId: string;
  let userBId: string;
  let userAToken: string;
  let userBToken: string;
  let ruleId: string;

  async function registerVerifyAndLogin(email: string, fullName: string) {
    await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        fullName,
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

    return {
      userId: user!.userId.toString(),
      token: loginRes.body.accessToken as string,
    };
  }

  async function createUncategorizedUberTransaction(
    userId: string,
    amount: number,
    description?: string,
  ) {
    return prisma.transaction.create({
      data: {
        userId: BigInt(userId),
        transactionDate: new Date("2026-02-02T00:00:00.000Z"),
        description: description ?? "UBER CANADA/UBERTRIP TORONTO, ON",
        amount: new Prisma.Decimal(amount),
        currency: "CAD",
        transactionType: TransactionType.DEBIT,
        source: TransactionSource.CSV,
        spendCategory: SpendCategory.UNCATEGORIZED,
      },
    });
  }

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;

    await cleanupAuthUser(prisma, userAEmail);
    await cleanupAuthUser(prisma, userBEmail);

    const userA = await registerVerifyAndLogin(userAEmail, "Rules User A");
    const userB = await registerVerifyAndLogin(userBEmail, "Rules User B");

    userAId = userA.userId;
    userBId = userB.userId;
    userAToken = userA.token;
    userBToken = userB.token;
  });

  afterAll(async () => {
    await cleanupAuthUser(prisma, userAEmail);
    await cleanupAuthUser(prisma, userBEmail);
    await closeTestApp(app, prisma);
  });

  it("POST /rules should reject rule creation without auth", async () => {
    await request(app.getHttpServer())
      .post("/rules")
      .send({
        isActive: true,
        priority: 1,
        merchantContains: "UBER",
        spendCategory: SpendCategory.TRANSPORTATION,
      })
      .expect(401);
  });

  it("GET /rules should reject listing without auth", async () => {
    await request(app.getHttpServer())
      .get("/rules")
      .expect(401);
  });

  it("POST /rules should create a rule for the authenticated user only", async () => {
    const tx = await createUncategorizedUberTransaction(userAId, -15.38);

    const res = await request(app.getHttpServer())
      .post("/rules")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        isActive: true,
        priority: 1,
        merchantContains: "UBER",
        spendCategory: SpendCategory.TRANSPORTATION,
      })
      .expect(201);

    expect(res.body).toHaveProperty("ruleId");
    expect(res.body.userId).toBe(userAId);
    expect(res.body.merchantContains).toBe("UBER");
    expect(res.body.spendCategory).toBe(SpendCategory.TRANSPORTATION);

    ruleId = res.body.ruleId;

    const updatedTx = await prisma.transaction.findUnique({
      where: { transactionId: tx.transactionId },
      select: { spendCategory: true },
    });

    expect(updatedTx?.spendCategory).toBe(SpendCategory.TRANSPORTATION);
  });

  it("GET /rules should list only the authenticated user's rules", async () => {
    const res = await request(app.getHttpServer())
      .get("/rules")
      .set("Authorization", `Bearer ${userAToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);

    const createdRule = res.body.find((r: any) => r.ruleId === ruleId);
    expect(createdRule).toBeTruthy();
    expect(createdRule.merchantContains).toBe("UBER");
    expect(createdRule.spendCategory).toBe(SpendCategory.TRANSPORTATION);
  });

  it("PATCH /rules/:id should reject update without auth", async () => {
    await request(app.getHttpServer())
      .patch(`/rules/${ruleId}`)
      .send({
        spendCategory: SpendCategory.TRAVEL,
      })
      .expect(401);
  });

  it("DELETE /rules/:id should reject delete without auth", async () => {
    await request(app.getHttpServer())
      .delete(`/rules/${ruleId}`)
      .expect(401);
  });

  it("PATCH /rules/:id should reject another user's access", async () => {
    await request(app.getHttpServer())
      .patch(`/rules/${ruleId}`)
      .set("Authorization", `Bearer ${userBToken}`)
      .send({
        spendCategory: SpendCategory.TRAVEL,
      })
      .expect(403);
  });

  it("DELETE /rules/:id should reject another user's access", async () => {
    await request(app.getHttpServer())
      .delete(`/rules/${ruleId}`)
      .set("Authorization", `Bearer ${userBToken}`)
      .expect(403);
  });

  it("PATCH /rules/:id should update rule and reapply to existing uncategorized transactions for the owner", async () => {
    const tx = await createUncategorizedUberTransaction(
      userAId,
      -22.45,
      "UBER CANADA/UBERTRIP WATERLOO, ON",
    );

    const res = await request(app.getHttpServer())
      .patch(`/rules/${ruleId}`)
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        spendCategory: SpendCategory.TRAVEL,
        priority: 2,
      })
      .expect(200);

    expect(res.body.ruleId).toBe(ruleId);
    expect(res.body.spendCategory).toBe(SpendCategory.TRAVEL);
    expect(res.body.priority).toBe(2);

    const updatedTx = await prisma.transaction.findUnique({
      where: { transactionId: tx.transactionId },
      select: { spendCategory: true },
    });

    expect(updatedTx?.spendCategory).toBe(SpendCategory.TRAVEL);
  });

  it("DELETE /rules/:id should remove the rule for the owner", async () => {
    const res = await request(app.getHttpServer())
      .delete(`/rules/${ruleId}`)
      .set("Authorization", `Bearer ${userAToken}`)
      .expect(200);

    expect(res.body.ruleId).toBe(ruleId);

    const rulesAfterDelete = await request(app.getHttpServer())
      .get("/rules")
      .set("Authorization", `Bearer ${userAToken}`)
      .expect(200);

    expect(Array.isArray(rulesAfterDelete.body)).toBe(true);
    expect(
      rulesAfterDelete.body.find((r: any) => r.ruleId === ruleId),
    ).toBeUndefined();
  });

  it("after rule deletion, new matching uncategorized transactions should remain uncategorized", async () => {
    const tx = await createUncategorizedUberTransaction(
      userAId,
      -18.99,
      "UBER CANADA/UBEREATS TORONTO, ON",
    );

    const fetchedTx = await prisma.transaction.findUnique({
      where: { transactionId: tx.transactionId },
      select: { spendCategory: true },
    });

    expect(fetchedTx?.spendCategory).toBe(SpendCategory.UNCATEGORIZED);
  });

  it("PATCH /rules/:id should return 404 for a deleted or missing rule", async () => {
    const res = await request(app.getHttpServer())
      .patch(`/rules/${ruleId}`)
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        spendCategory: SpendCategory.OTHER,
      })
      .expect(404);

    expect(res.body.message).toBe("Rule not found");
  });
});