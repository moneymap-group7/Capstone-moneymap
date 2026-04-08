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
    let statementId: bigint;

    try {
      statementId = BigInt(id);
    } catch {
      throw new BadRequestException("Invalid file id.");
    }

    const file = await this.prisma.statement.findFirst({
      where: {
        statementId,
        userId: BigInt(userId),
      },
      select: {
        statementId: true,
        relativePath: true,
      },
    });

    if (!file) {
      throw new BadRequestException("File not found.");
    }

    const absolutePath = path.join(process.cwd(), file.relativePath);

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    await this.prisma.statement.delete({
      where: {
        statementId,
      },
    });

    return { message: "File deleted successfully." };
  }
}