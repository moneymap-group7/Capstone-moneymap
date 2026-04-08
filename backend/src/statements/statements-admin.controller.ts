import { BadRequestException, Injectable } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class StatementsAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllStatementFiles(userId: string) {
    return this.prisma.statement.findMany({
      where: {
        userId: BigInt(userId),
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        statementId: true,
        originalFileName: true,
        storedFileName: true,
        relativePath: true,
        size: true,
        mimeType: true,
        bank: true,
        fileHash: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteStatementFile(userId: string, id: string) {
  const userIdBigInt = BigInt(userId);
  const statementIdBigInt = BigInt(id);

  const statement = await this.prisma.statement.findFirst({
    where: {
      statementId: statementIdBigInt,
      userId: userIdBigInt,
    },
  });

  if (!statement) {
    throw new Error("Statement not found");
  }

  await this.prisma.$transaction(async (tx) => {
    await tx.transaction.deleteMany({
      where: {
        userId: userIdBigInt,
        statementId: statementIdBigInt,
      },
    });

    await tx.statement.delete({
      where: {
        statementId: statementIdBigInt,
      },
    });
  });

  const absPath = path.join(process.cwd(), statement.relativePath);

  if (fs.existsSync(absPath)) {
    try {
      fs.unlinkSync(absPath);
    } catch (err) {
      console.warn("File delete failed:", absPath);
    }
  }

  return {
    ok: true,
    message: "Statement and related transactions deleted successfully",
  };
}
}