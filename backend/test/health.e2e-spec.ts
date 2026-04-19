import request from "supertest";
import { INestApplication } from "@nestjs/common";
import { PrismaService } from "../src/prisma/prisma.service";
import { closeTestApp, createTestApp } from "./test-helpers";

describe("Health E2E", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
  });

  afterAll(async () => {
    await closeTestApp(app, prisma);
  });

  it("GET /health should return ok", async () => {
    const res = await request(app.getHttpServer())
      .get("/health")
      .expect(200);

    expect(res.body.status).toBe("ok");
    expect(res.body).toHaveProperty("uptime");
    expect(res.body).toHaveProperty("timestamp");
  });

  it("GET /health/db should return connected", async () => {
    const res = await request(app.getHttpServer())
      .get("/health/db")
      .expect(200);

    expect(res.body.status).toBe("ok");
    expect(res.body.db).toBe("connected");
    expect(res.body).toHaveProperty("timestamp");
  });
});
