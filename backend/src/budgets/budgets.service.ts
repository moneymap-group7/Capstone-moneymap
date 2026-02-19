import { Injectable,NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: bigint, dto: CreateBudgetDto) {
    return this.prisma.budget.create({
      data: {
        userId,
        name: dto.name,
        amount: dto.amount,
        spendCategory: dto.spendCategory,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll(userId: bigint) {
    return this.prisma.budget.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: bigint, budgetId: bigint) {
    const budget = await this.prisma.budget.findUnique({
      where: { budgetId },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    if (budget.userId !== userId) {
      throw new NotFoundException('Budget not found');
    }

    return budget;
  }

  async update(budgetId: bigint, dto: UpdateBudgetDto) {
    return this.prisma.budget.update({
      where: { budgetId },
      data: {
        name: dto.name,
        amount: dto.amount,
        spendCategory: dto.spendCategory,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        isActive: dto.isActive,
      },
    });
  }

  async remove(budgetId: bigint) {
    await this.prisma.budget.delete({
      where: { budgetId },
    });

    return { deleted: true };
  } 
}
