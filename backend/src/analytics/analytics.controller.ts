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

    @Get("top-merchants")
  @UseGuards(JwtAuthGuard)
  async topMerchants(
    @Req() req: Request,
    @Query("start") start?: string,
    @Query("end") end?: string,
    @Query("limit") limit?: string,
  ) {
    const userId = (req as any)?.user?.userId;
    if (!userId) throw new UnauthorizedException();

    const { startDate, endDate } = parseDateRange(
      { ...(req.query as any), start, end },
      { daysBack: 30 },
    );

    const lim = Math.min(Math.max(Number(limit ?? 10) || 10, 1), 50);

    return this.analyticsService.getTopMerchants(userId, startDate, endDate, {
      limit: lim,
    });
  }
    @Get("recurring")
  @UseGuards(JwtAuthGuard)
  async recurring(
    @Req() req: Request,
    @Query("months") monthsStr?: string,
    @Query("end") end?: string,
  ) {
    const userId = (req as any)?.user?.userId;
    if (!userId) throw new UnauthorizedException();

    const months = Math.min(Math.max(Number(monthsStr ?? 6) || 6, 1), 24);

    const now = new Date();
    const endDate = end ? new Date(String(end)) : now;
    const startDate = new Date(Date.UTC(
      endDate.getUTCFullYear(),
      endDate.getUTCMonth() - months,
      endDate.getUTCDate(),
      0, 0, 0,
    ));

    return this.analyticsService.getRecurring(userId, startDate, endDate, {
      months,
    });
  }

  @Get("aggregation")
@UseGuards(JwtAuthGuard)
async aggregation(
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

  return this.analyticsService.getAggregation(userId, startDate, endDate);
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