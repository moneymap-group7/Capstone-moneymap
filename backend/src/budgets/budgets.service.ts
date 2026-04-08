import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateBudgetDto } from "./dto/create-budget.dto";
import { UpdateBudgetDto } from "./dto/update-budget.dto";

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  private startOfMonthUTC(input: Date) {
    return new Date(
      Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), 1, 0, 0, 0, 0)
    );
  }

  private endOfMonthUTC(input: Date) {
    return new Date(
      Date.UTC(
        input.getUTCFullYear(),
        input.getUTCMonth() + 1,
        0,
        23,
        59,
        59,
        999
      )
    );
  }

  private addMonthsUTC(input: Date, months: number) {
    return new Date(
      Date.UTC(
        input.getUTCFullYear(),
        input.getUTCMonth() + months,
        1,
        0,
        0,
        0,
        0
      )
    );
  }

  private addDaysUTC(input: Date, days: number) {
    return new Date(
      Date.UTC(
        input.getUTCFullYear(),
        input.getUTCMonth(),
        input.getUTCDate() + days,
        input.getUTCHours(),
        input.getUTCMinutes(),
        input.getUTCSeconds(),
        input.getUTCMilliseconds()
      )
    );
  }

  private minDate(a: Date, b: Date) {
    return a.getTime() <= b.getTime() ? a : b;
  }

  async create(userId: bigint, dto: CreateBudgetDto) {
    const rawStart = new Date(dto.startDate);

    if (Number.isNaN(rawStart.getTime())) {
      throw new BadRequestException("Invalid startDate");
    }

    const startDate = this.startOfMonthUTC(rawStart);
    const endDate = this.endOfMonthUTC(this.addMonthsUTC(startDate, 11));
    const previousMonthEnd = this.addDaysUTC(startDate, -1);

    return this.prisma.$transaction(async (tx) => {
      const sameStart = await tx.budget.findFirst({
        where: {
          userId,
          spendCategory: dto.spendCategory,
          startDate,
        },
      });

      if (sameStart) {
        await tx.budget.deleteMany({
          where: {
            userId,
            spendCategory: dto.spendCategory,
            budgetId: { not: sameStart.budgetId },
            startDate: { gte: startDate, lte: endDate },
          },
        });

        return tx.budget.update({
          where: { budgetId: sameStart.budgetId },
          data: {
            name: dto.name,
            amount: dto.amount,
            isActive: dto.isActive ?? true,
            startDate,
            endDate,
          },
        });
      }

      const previousActive = await tx.budget.findFirst({
        where: {
          userId,
          spendCategory: dto.spendCategory,
          startDate: { lt: startDate },
          OR: [{ endDate: null }, { endDate: { gte: startDate } }],
        },
        orderBy: { startDate: "desc" },
      });

      if (previousActive) {
        await tx.budget.update({
          where: { budgetId: previousActive.budgetId },
          data: {
            endDate: previousMonthEnd,
          },
        });
      }

      await tx.budget.deleteMany({
        where: {
          userId,
          spendCategory: dto.spendCategory,
          startDate: { gte: startDate, lte: endDate },
        },
      });

      return tx.budget.create({
        data: {
          userId,
          name: dto.name,
          amount: dto.amount,
          spendCategory: dto.spendCategory,
          startDate,
          endDate,
          isActive: dto.isActive ?? true,
        },
      });
    });
  }

  async findAll(userId: bigint) {
    return this.prisma.budget.findMany({
      where: { userId },
      orderBy: [{ startDate: "desc" }, { spendCategory: "asc" }],
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
    const existing = await this.findOne(userId, budgetId);

    const nextName = dto.name ?? existing.name;
    const nextAmount = dto.amount ?? Number(existing.amount);
    const nextCategory = dto.spendCategory ?? existing.spendCategory;
    const nextIsActive = dto.isActive ?? existing.isActive;
    const nextStartDate = dto.startDate
      ? this.startOfMonthUTC(new Date(dto.startDate))
      : new Date(existing.startDate);

    if (Number.isNaN(nextStartDate.getTime())) {
      throw new BadRequestException("Invalid startDate");
    }

    await this.prisma.budget.delete({
      where: { budgetId },
    });

    return this.create(userId, {
      name: nextName,
      amount: nextAmount,
      spendCategory: nextCategory,
      startDate: nextStartDate.toISOString(),
      isActive: nextIsActive,
    });
  }

  async remove(userId: bigint, budgetId: bigint) {
    const target = await this.findOne(userId, budgetId);

    return this.prisma.$transaction(async (tx) => {
      const previous = await tx.budget.findFirst({
        where: {
          userId,
          spendCategory: target.spendCategory,
          startDate: { lt: target.startDate },
        },
        orderBy: { startDate: "desc" },
      });

      const next = await tx.budget.findFirst({
        where: {
          userId,
          spendCategory: target.spendCategory,
          startDate: { gt: target.startDate },
        },
        orderBy: { startDate: "asc" },
      });

      await tx.budget.delete({
        where: { budgetId },
      });

      if (previous) {
        const previousNaturalEnd = this.endOfMonthUTC(
          this.addMonthsUTC(new Date(previous.startDate), 11)
        );

        let repairedEnd = previousNaturalEnd;

        if (next) {
          const dayBeforeNext = this.addDaysUTC(new Date(next.startDate), -1);
          repairedEnd = this.minDate(previousNaturalEnd, dayBeforeNext);
        }

        await tx.budget.update({
          where: { budgetId: previous.budgetId },
          data: {
            endDate: repairedEnd,
          },
        });
      }

      return { success: true };
    });
  }
}