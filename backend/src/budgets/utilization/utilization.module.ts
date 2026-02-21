import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { UtilizationService } from "./utilization.service";
import { AlertsService } from "../../common/alerts/alerts.service";

@Module({
  imports: [PrismaModule],
  providers: [UtilizationService, AlertsService],
  exports: [UtilizationService],
})
export class UtilizationModule {}