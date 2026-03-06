import { Injectable } from "@nestjs/common";
import { Prisma, SpendCategory, TransactionType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export type RuleEngineInput = {
  userId: bigint;
  description: string;
  amount?: Prisma.Decimal;
  transactionType?: TransactionType;
};

@Injectable()
export class RuleEngineService {
  constructor(private readonly prisma: PrismaService) {}

  private normalize(value: string): string {
    return (value ?? "").replace(/\s+/g, " ").trim().toUpperCase();
  }

  private matchesMerchant(description: string, rule: any): boolean {
    const descNorm = this.normalize(description);

    if (rule.merchantEquals) {
      return descNorm === this.normalize(String(rule.merchantEquals));
    }

    if (rule.merchantContains) {
      return descNorm.includes(this.normalize(String(rule.merchantContains)));
    }

    return false;
  }

  private matchesAmount(amount: Prisma.Decimal | undefined, rule: any): boolean {
    if (!amount) return true;

    if (rule.minAmount && amount.lessThan(rule.minAmount)) {
      return false;
    }

    if (rule.maxAmount && amount.greaterThan(rule.maxAmount)) {
      return false;
    }

    return true;
  }

  private matchesTransactionType(
    transactionType: TransactionType | undefined,
    rule: any,
  ): boolean {
    if (!rule.transactionType) return true;
    if (!transactionType) return false;
    return transactionType === rule.transactionType;
  }

  async evaluate(input: RuleEngineInput): Promise<SpendCategory | null> {
    const rules = await this.prisma.userCategoryRule.findMany({
      where: {
        userId: input.userId,
        isActive: true,
      },
      orderBy: [{ priority: "asc" }, { ruleId: "asc" }],
    });

    for (const rule of rules) {
      const merchantMatch = this.matchesMerchant(input.description, rule);
      if (!merchantMatch) continue;

      const amountMatch = this.matchesAmount(input.amount, rule);
      if (!amountMatch) continue;

      const typeMatch = this.matchesTransactionType(
        input.transactionType,
        rule,
      );
      if (!typeMatch) continue;

      return rule.spendCategory;
    }

    return null;
  }
}