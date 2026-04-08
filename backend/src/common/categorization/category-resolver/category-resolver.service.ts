import { Injectable } from "@nestjs/common";
import { Prisma, SpendCategory, TransactionType } from "@prisma/client";
import { AutoCategorizeService } from "../auto-categorize.service";
import { RuleEngineService } from "../../../rules/rule-engine/rule-engine.service";

export type CategoryResolverInput = {
  userId: bigint;
  description: string;
  amount?: Prisma.Decimal;
  transactionType?: TransactionType;
};

@Injectable()
export class CategoryResolverService {
  constructor(
    private readonly ruleEngineService: RuleEngineService,
    private readonly autoCategorizeService: AutoCategorizeService,
  ) {}

  async resolve(input: CategoryResolverInput): Promise<SpendCategory> {
    const userRuleCategory = await this.ruleEngineService.evaluate({
      userId: input.userId,
      description: input.description,
      amount: input.amount,
      transactionType: input.transactionType,
    });

    if (userRuleCategory) {
      return userRuleCategory;
    }

    return this.autoCategorizeService.categorize({
      description: input.description,
    });
  }
}