import { Module } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { PrismaModule } from "../prisma/prisma.module";
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [PrismaModule],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}