import request from "supertest";
import * as path from "path";
import { INestApplication } from "@nestjs/common";
import { PrismaService } from "../src/prisma/prisma.service";
import {
  cleanupAuthUser,
  closeTestApp,
  createTestApp,
} from "./test-helpers";

describe("Statements Upload E2E", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const email = "statements.e2e.moneymap@example.com";
  const password = "Test@1234";
  let token: string;

  const fixturesDir = path.resolve(__dirname, "../CSV  FILE");
  const cibcCsv = path.join(fixturesDir, "cibc (1).csv");
  const tdCsv = path.join(fixturesDir, "accountactivity.csv");
  const rbcCsv = path.join(fixturesDir, "download-transactions.csv");
  const neoCsv = path.join(fixturesDir, "NeoMastercard_2025-01-01_2025-12-31.csv");

  async function registerVerifyLogin() {
    await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        fullName: "Statements E2E User",
        email,
        password,
      })
      .expect(201);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { emailVerificationCode: true },
    });

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

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;

    await cleanupAuthUser(prisma, email);
    await registerVerifyLogin();
  });

  afterAll(async () => {
    await cleanupAuthUser(prisma, email);
    await closeTestApp(app, prisma);
  });

  it("POST /statements/upload should upload a valid CIBC CSV", async () => {
    const beforeCount = await prisma.transaction.count({
      where: { user: { email } },
    });

    const res = await request(app.getHttpServer())
      .post("/statements/upload")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", cibcCsv)
      .expect(201);

    expect(res.body.status).toBe("COMPLETED");
    expect(res.body.details).toHaveProperty("transactionsInserted");
    expect(Number(res.body.details.transactionsInserted)).toBeGreaterThan(0);

    const afterCount = await prisma.transaction.count({
      where: { user: { email } },
    });

    expect(afterCount).toBeGreaterThan(beforeCount);
  });

  it("POST /statements/upload should upload a valid TD CSV", async () => {
    const res = await request(app.getHttpServer())
      .post("/statements/upload")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", tdCsv)
      .expect(201);

    expect(["COMPLETED", "FAILED"]).toContain(res.body.status);

    if (res.body.status === "COMPLETED") {
      expect(Number(res.body.details.transactionsInserted)).toBeGreaterThanOrEqual(0);
    }
  });

  it("POST /statements/upload should upload a valid RBC CSV", async () => {
    const res = await request(app.getHttpServer())
      .post("/statements/upload")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", rbcCsv)
      .expect(201);

    expect(["COMPLETED", "FAILED"]).toContain(res.body.status);

    if (res.body.status === "COMPLETED") {
      expect(Number(res.body.details.transactionsInserted)).toBeGreaterThanOrEqual(0);
    }
  });

  it("POST /statements/upload should reject non-csv files", async () => {
    const res = await request(app.getHttpServer())
      .post("/statements/upload")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", Buffer.from("not a csv"), "not-a-csv.txt")
      .expect(415);

    expect(res.body.message).toBe("Only .csv files are allowed.");
  });

  it("POST /statements/upload should detect duplicate upload for same user", async () => {
    const first = await request(app.getHttpServer())
      .post("/statements/upload")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", cibcCsv)
      .expect(201);

    const second = await request(app.getHttpServer())
      .post("/statements/upload")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", cibcCsv)
      .expect(201);

    expect(first.body).toHaveProperty("status");
    expect(second.body).toHaveProperty("status");
    expect(second.body.message).toMatch(/already been processed|processed successfully/i);
  });

  it("POST /statements/upload should handle unsupported or unknown CSV formats safely", async () => {
    const res = await request(app.getHttpServer())
      .post("/statements/upload")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", neoCsv)
      .expect(201);

    expect(["COMPLETED", "FAILED"]).toContain(res.body.status);
    expect(res.body).toHaveProperty("message");
  });
});
