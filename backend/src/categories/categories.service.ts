import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories() {
    const rows = await this.prisma.bankCategoryRule.findMany({
      select: { spendCategory: true },
      distinct: ["spendCategory"],
      orderBy: { spendCategory: "asc" },
    });

    // return array of strings
    return rows.map((r) => r.spendCategory);
  }
}