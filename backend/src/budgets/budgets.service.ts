import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateBudgetDto } from "./dto/create-budget.dto";
import { UpdateBudgetDto } from "./dto/update-budget.dto";

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: bigint, dto: CreateBudgetDto) {
    return this.prisma.budget.create({
      data: {
        userId,
        ...dto,
      },
    });
  }

  async findAll(userId: bigint) {
    return this.prisma.budget.findMany({
      where: { userId },
    });
  }

  async findOne(userId: bigint, budgetId: bigint) {
    const budget = await this.prisma.budget.findFirst({
      where: { budgetId, userId },
    });

    if (!budget) throw new NotFoundException("Budget not found");
    return budget;
  }

  async update(userId: bigint, budgetId: bigint, dto: UpdateBudgetDto) {
    // Ensure budget belongs to user
    await this.findOne(userId, budgetId);

    return this.prisma.budget.update({
      where: { budgetId },
      data: {
        ...dto,
      },
    });
  }

  async remove(userId: bigint, budgetId: bigint) {
    // Ensure budget belongs to user
    await this.findOne(userId, budgetId);

    return this.prisma.budget.delete({
      where: { budgetId },
    });
  }
}