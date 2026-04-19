import request from "supertest";
import { INestApplication } from "@nestjs/common";
import { PrismaService } from "../src/prisma/prisma.service";
import {
  cleanupAuthUser,
  closeTestApp,
  createTestApp,
} from "./test-helpers";

describe("Auth E2E", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const email = "auth.e2e.moneymap@example.com";
  const initialPassword = "Test@1234";
  const resetPasswordValue = "NewPass@123";
  const changedPasswordValue = "Another@123";

  let token = "";

  async function loginAndGetToken(password: string) {
    const res = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email,
        password,
      })
      .expect(200);

    expect(res.body).toHaveProperty("accessToken");
    expect(typeof res.body.accessToken).toBe("string");

    return res.body.accessToken as string;
  }

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
    await cleanupAuthUser(prisma, email);
  });

  afterAll(async () => {
    await cleanupAuthUser(prisma, email);
    await closeTestApp(app, prisma);
  });

  it("POST /auth/register should create a new user", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        fullName: "Auth E2E User",
        email,
        password: initialPassword,
      })
      .expect(201);

    expect(res.body.message).toBe("Verification code sent to your email");
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.fullName).toBe("Auth E2E User");
  });

  it("POST /auth/login should reject unverified user", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email,
        password: initialPassword,
      })
      .expect(401);

    expect(res.body.message).toBe("Please verify your email before logging in");
  });

  it("POST /auth/verify-email should reject invalid code", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/verify-email")
      .send({
        email,
        code: "000000",
      })
      .expect(400);

    expect(res.body.message).toBe("Invalid verification code");
  });

  it("POST /auth/verify-email should verify with correct code", async () => {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        emailVerificationCode: true,
      },
    });

    expect(user?.emailVerificationCode).toBeTruthy();

    const res = await request(app.getHttpServer())
      .post("/auth/verify-email")
      .send({
        email,
        code: user!.emailVerificationCode,
      })
      .expect(201);

    expect(res.body.message).toBe("Email verified successfully");
  });

  it("POST /auth/login should return access token for verified user", async () => {
    token = await loginAndGetToken(initialPassword);
  });

  it("POST /auth/login should reject wrong password", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email,
        password: "WrongPassword@123",
      })
      .expect(401);

    expect(res.body.message).toBe("Invalid credentials");
  });

  it("GET /auth/me should reject missing token", async () => {
    const res = await request(app.getHttpServer())
      .get("/auth/me")
      .expect(401);

    expect(res.body.message).toBe("Unauthorized");
  });

  it("GET /auth/me should return user info with valid token", async () => {
    const res = await request(app.getHttpServer())
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body.email).toBe(email);
    expect(res.body.fullName).toBe("Auth E2E User");
    expect(res.body).toHaveProperty("userId");
  });

  it("POST /auth/forgot-password/request should work for valid verified email", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/forgot-password/request")
      .send({ email })
      .expect(201);

    expect(res.body.message).toBe(
      "If an account exists for this email, a reset code has been sent",
    );

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        passwordResetCode: true,
        passwordResetExpiresAt: true,
        passwordResetUsedAt: true,
      },
    });

    expect(user?.passwordResetCode).toBeTruthy();
    expect(user?.passwordResetExpiresAt).toBeTruthy();
    expect(user?.passwordResetUsedAt).toBeNull();
  });

  it("POST /auth/forgot-password/request should return same safe response for nonexistent email", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/forgot-password/request")
      .send({ email: "doesnotexist@example.com" })
      .expect(201);

    expect(res.body.message).toBe(
      "If an account exists for this email, a reset code has been sent",
    );
  });

  it("POST /auth/forgot-password/reset should reject same old password", async () => {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        passwordResetCode: true,
      },
    });

    expect(user?.passwordResetCode).toBeTruthy();

    const res = await request(app.getHttpServer())
      .post("/auth/forgot-password/reset")
      .send({
        email,
        code: user!.passwordResetCode,
        newPassword: initialPassword,
      })
      .expect(400);

    expect(res.body.message).toBe(
      "Password cannot be the same as the old password",
    );
  });

  it("POST /auth/forgot-password/reset should reset password successfully with valid code", async () => {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        passwordResetCode: true,
      },
    });

    expect(user?.passwordResetCode).toBeTruthy();

    const res = await request(app.getHttpServer())
      .post("/auth/forgot-password/reset")
      .send({
        email,
        code: user!.passwordResetCode,
        newPassword: resetPasswordValue,
      })
      .expect(201);

    expect(res.body.message).toBe("Password reset successful");
  });

  it("POST /auth/login should reject old password after reset", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email,
        password: initialPassword,
      })
      .expect(401);

    expect(res.body.message).toBe("Invalid credentials");
  });

  it("POST /auth/login should allow login with reset password", async () => {
    token = await loginAndGetToken(resetPasswordValue);
  });

  it("POST /auth/change-password should reject wrong old password", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        oldPassword: "WrongPass@123",
        newPassword: changedPasswordValue,
        confirmNewPassword: changedPasswordValue,
      })
      .expect(400);

    expect(res.body.message).toBe("Old password is incorrect");
  });

  it("POST /auth/change-password should change password successfully", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        oldPassword: resetPasswordValue,
        newPassword: changedPasswordValue,
        confirmNewPassword: changedPasswordValue,
      })
      .expect(201);

    expect(res.body.message).toBe("Password changed successfully");
  });

  it("POST /auth/login should allow login with changed password", async () => {
    token = await loginAndGetToken(changedPasswordValue);
  });

  it("PATCH /auth/profile should update full name", async () => {
    const res = await request(app.getHttpServer())
      .patch("/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        fullName: "Updated Name",
      })
      .expect(200);

    expect(res.body.message).toBe("Profile updated successfully");
    expect(res.body.user.fullName).toBe("Updated Name");
    expect(res.body.user.email).toBe(email);
  });

  it("PATCH /auth/profile should reject same name", async () => {
    const res = await request(app.getHttpServer())
      .patch("/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        fullName: "Updated Name",
      })
      .expect(400);

    expect(res.body.message).toBe("Please enter a different name to update");
  });

  it("GET /auth/me should reject tampered token", async () => {
    const res = await request(app.getHttpServer())
      .get("/auth/me")
      .set("Authorization", "Bearer invalid.token.value")
      .expect(401);

    expect(res.body.message).toBe("Unauthorized");
  });
});