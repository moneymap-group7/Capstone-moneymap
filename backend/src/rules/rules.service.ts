import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateRuleDto } from "./dto/create-rule.dto";
import { UpdateRuleDto } from "./dto/update-rule.dto";
import { RuleEngineService } from "./rule-engine/rule-engine.service";

@Injectable()
export class RulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ruleEngineService: RuleEngineService,
  ) {}

  async create(dto: CreateRuleDto) {
    const userId = BigInt(dto.userId);

    const rule = await this.prisma.userCategoryRule.create({
      data: {
        userId,
        isActive: dto.isActive ?? true,
        priority: dto.priority ?? 100,
        merchantContains: dto.merchantContains ?? null,
        merchantEquals: dto.merchantEquals ?? null,
        minAmount:
          dto.minAmount !== undefined && dto.minAmount !== null
            ? new Prisma.Decimal(dto.minAmount)
            : null,
        maxAmount:
          dto.maxAmount !== undefined && dto.maxAmount !== null
            ? new Prisma.Decimal(dto.maxAmount)
            : null,
        transactionType: dto.transactionType ?? null,
        spendCategory: dto.spendCategory,
      },
    });

    await this.ruleEngineService.reapplyRulesToExistingTransactions(userId);

    return rule;
  }

  findAll(userId: number) {
    return this.prisma.userCategoryRule.findMany({
      where: { userId: BigInt(userId) },
      orderBy: [{ priority: "asc" }, { ruleId: "asc" }],
    });
  }

  async update(id: string, dto: UpdateRuleDto = {}) {
    const ruleId = BigInt(id);

    const existing = await this.prisma.userCategoryRule.findUnique({
      where: { ruleId },
    });

    if (!existing) {
      throw new NotFoundException("Rule not found");
    }

    const updated = await this.prisma.userCategoryRule.update({
      where: { ruleId },
      data: {
        userId: dto.userId ? BigInt(dto.userId) : undefined,
        isActive: dto.isActive ?? undefined,
        priority: dto.priority ?? undefined,
        merchantContains: dto.merchantContains ?? undefined,
        merchantEquals: dto.merchantEquals ?? undefined,
        minAmount:
          dto.minAmount !== undefined
            ? dto.minAmount === null
              ? null
              : new Prisma.Decimal(dto.minAmount)
            : undefined,
        maxAmount:
          dto.maxAmount !== undefined
            ? dto.maxAmount === null
              ? null
              : new Prisma.Decimal(dto.maxAmount)
            : undefined,
        transactionType: dto.transactionType ?? undefined,
        spendCategory: dto.spendCategory ?? undefined,
      },
    });

    await this.ruleEngineService.reapplyRulesToExistingTransactions(
      updated.userId,
    );

    return updated;
  }

  async remove(id: string) {
    const ruleId = BigInt(id);

    const existing = await this.prisma.userCategoryRule.findUnique({
      where: { ruleId },
    });

    if (!existing) {
      throw new NotFoundException("Rule not found");
    }

    const deleted = await this.prisma.userCategoryRule.delete({
      where: { ruleId },
    });

    await this.ruleEngineService.reapplyRulesToExistingTransactions(
      existing.userId,
    );

    return deleted;
  }
}