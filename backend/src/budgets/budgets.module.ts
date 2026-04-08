import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { UtilizationModule } from "./utilization/utilization.module";
import { BudgetsController } from "./budgets.controller";
import { BudgetsService } from "./budgets.service";

@Module({
  imports: [PrismaModule, UtilizationModule],
  controllers: [BudgetsController],
  providers: [BudgetsService],
})
export class BudgetsModule {}