import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { Request } from "express";
import { AnalyticsService } from "./analytics.service";

@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("summary")
  @UseGuards(JwtAuthGuard)
  async summary(
    @Req() req: Request,
    @Query("start") start?: string,
    @Query("end") end?: string,
  ) {
    const user = (req as any).user;
    const userId = user?.userId;

    const endDate = end ? new Date(end) : new Date();
    const startDate = start
      ? new Date(start)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    return this.analyticsService.getSummary(userId, startDate, endDate);
  }

    @Get("monthly")
  @UseGuards(JwtAuthGuard)
  async monthly(
    @Req() req: Request,
    @Query("start") start?: string,
    @Query("end") end?: string,
    @Query("includeCategoryMonthly") includeCategoryMonthly?: string,
  ) {
    const userId = (req as any)?.user?.userId;

    const endDate = end ? new Date(end) : new Date();
    const startDate = start
      ? new Date(start)
      : new Date(endDate.getTime() - 180 * 24 * 60 * 60 * 1000); // default 6 months

    const include = includeCategoryMonthly === "true";

    return this.analyticsService.getMonthlySummary(userId, startDate, endDate, {
      includeCategoryMonthly: include,
    });
  }

}