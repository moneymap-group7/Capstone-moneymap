import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";

import { BudgetsController } from "./budgets.controller";
import { BudgetsService } from "./budgets.service";

import { UtilizationController } from "./utilization/utilization.controller";
import { UtilizationService } from "./utilization/utilization.service";

@Module({
  imports: [PrismaModule],
  controllers: [BudgetsController, UtilizationController],
  providers: [BudgetsService, UtilizationService],
  exports: [BudgetsService, UtilizationService],
})
export class BudgetsModule {}