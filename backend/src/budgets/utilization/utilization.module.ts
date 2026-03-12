import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { UtilizationService } from "./utilization.service";
import { AlertsService } from "../../common/alerts/alerts.service";
import { UtilizationController } from "./utilization.controller";

@Module({
  imports: [PrismaModule],
  controllers: [UtilizationController],
  providers: [UtilizationService, AlertsService],
  exports: [UtilizationService],
})
export class UtilizationModule {}