import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { ZodValidationPipe } from "nestjs-zod";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { MailService } from "../src/mail/mail.service";
import { GlobalHttpExceptionFilter } from "../src/common/filters/http-exception.filter";

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export function createMockMailService() {
  return {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  };
}

export async function createTestApp() {
  const mockMailService = createMockMailService();

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(MailService)
    .useValue(mockMailService)
    .compile();

  const app = moduleFixture.createNestApplication();

  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  await app.init();

  const prisma = app.get(PrismaService);

  return { app, prisma, mockMailService };
}

export async function cleanupAuthUser(prisma: PrismaService, email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  await prisma.transaction.deleteMany({
    where: {
      user: { email: normalizedEmail },
    },
  });

  await prisma.budget.deleteMany({
    where: {
      user: { email: normalizedEmail },
    },
  });

  await prisma.userCategoryRule.deleteMany({
    where: {
      user: { email: normalizedEmail },
    },
  });

  await prisma.statement.deleteMany({
    where: {
      user: { email: normalizedEmail },
    },
  });

  await prisma.user.deleteMany({
    where: { email: normalizedEmail },
  });
}

export async function closeTestApp(app: INestApplication, prisma: PrismaService) {
  await prisma.$disconnect();
  await app.close();
}
