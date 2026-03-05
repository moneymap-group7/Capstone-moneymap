import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
<<<<<<< HEAD

import { BudgetsController } from "./budgets.controller";
import { BudgetsService } from "./budgets.service";

import { UtilizationController } from "./utilization/utilization.controller";
import { UtilizationService } from "./utilization/utilization.service";

@Module({
  imports: [PrismaModule],
  controllers: [UtilizationController, BudgetsController],
  providers: [BudgetsService, UtilizationService],
  exports: [BudgetsService, UtilizationService],
=======
import { UtilizationModule } from "./utilization/utilization.module";
import { BudgetsController } from "./budgets.controller";
import { BudgetsService } from "./budgets.service";

@Module({
  imports: [PrismaModule, UtilizationModule],
  controllers: [BudgetsController],
  providers: [BudgetsService],
>>>>>>> f4f7c53be921385c9c832f42bd2eff0a702db8a0
})
export class BudgetsModule {}