import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { Request } from "express";
import { AnalyticsService } from "./analytics.service";
import { UnauthorizedException } from "@nestjs/common";
import { parseDateRange } from "./analytics.query";

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
    const userId = (req as any)?.user?.userId;
    if (!userId) throw new UnauthorizedException();

    const { startDate, endDate } = parseDateRange(
      { ...(req.query as any), start, end },
      { daysBack: 30 },
    );

    return this.analyticsService.getSummary(userId, startDate, endDate);
  }


     @Get("by-category")
  @UseGuards(JwtAuthGuard)
  async byCategory(
    @Req() req: Request,
    @Query("start") start?: string,
    @Query("end") end?: string,
  ) {
    const userId = (req as any)?.user?.userId;
    if (!userId) throw new UnauthorizedException();

    const { startDate, endDate } = parseDateRange(
      { ...(req.query as any), start, end },
      { daysBack: 30 },
    );

    return this.analyticsService.getByCategory(userId, startDate, endDate);
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
    if (!userId) throw new UnauthorizedException();

    const { startDate, endDate } = parseDateRange(
      { ...(req.query as any), start, end },
      { daysBack: 180 },
    );

    const include = includeCategoryMonthly === "true";

    return this.analyticsService.getMonthlySummary(userId, startDate, endDate, {
      includeCategoryMonthly: include,
    });
  }

}