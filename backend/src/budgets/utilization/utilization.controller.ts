<<<<<<< HEAD
import { Controller, Get, Query } from "@nestjs/common";
import { UtilizationService } from "./utilization.service";
=======
import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import { SpendCategory } from "@prisma/client";
import { UtilizationService } from "./utilization.service";
import type { UtilizationInput } from "./utilization.types";
>>>>>>> f4f7c53be921385c9c832f42bd2eff0a702db8a0

@Controller("budgets/utilization")
export class UtilizationController {
  constructor(private readonly utilizationService: UtilizationService) {}

<<<<<<< HEAD
  private readonly userId = BigInt(1);

  @Get()
  async utilization(
    @Query("start") startStr: string,
    @Query("end") endStr: string
  ) {
    const start = new Date(`${startStr}T00:00:00.000Z`);
    const end = new Date(`${endStr}T23:59:59.999Z`);

    const data = await this.utilizationService.getUtilizationForRange(
      this.userId,
      start,
      end
    );

    return { data };
  }

  @Get("compare")
  async compare(
    @Query("start") startStr: string,
    @Query("end") endStr: string
  ) {
    const start = new Date(`${startStr}T00:00:00.000Z`);
    const end = new Date(`${endStr}T23:59:59.999Z`);

    const data = await this.utilizationService.compareRanges(
      this.userId,
      start,
      end
    );

=======
  // TODO: Replace with real userId from JWT once auth guard is wired
  private readonly userId = BigInt(1);

  private parseDateParam(value: string | undefined, name: string): Date {
    if (!value) throw new BadRequestException(`${name} query param is required`);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException(`${name} must be in YYYY-MM-DD format`);
    }

    // Parse as UTC start-of-day to match range boundaries
    const d = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestException(`${name} is not a valid date`);
    }

    return d;
  }

  private startOfDayUTC(d: Date): Date {
    const out = new Date(d);
    out.setUTCHours(0, 0, 0, 0);
    return out;
  }

  private endOfDayUTC(d: Date): Date {
    const out = new Date(d);
    out.setUTCHours(23, 59, 59, 999);
    return out;
  }

  @Get()
  async utilization(@Query("start") startStr: string, @Query("end") endStr: string) {
    const startDate = this.parseDateParam(startStr, "start");
    const endDate = this.parseDateParam(endStr, "end");

    const start = this.startOfDayUTC(startDate);
    const end = this.endOfDayUTC(endDate);

    if (start > end) throw new BadRequestException("start must be <= end");

    const { rows, alerts } =
      await this.utilizationService.getUtilizationWithAlertsForRange(
        this.userId,
        start,
        end
      );

    return { data: rows, alerts };
  }

  @Get("compare")
  async compare(@Query("start") startStr: string, @Query("end") endStr: string) {
    const startDate = this.parseDateParam(startStr, "start");
    const endDate = this.parseDateParam(endStr, "end");

    const start = this.startOfDayUTC(startDate);
    const end = this.endOfDayUTC(endDate);

    if (start > end) throw new BadRequestException("start must be <= end");

    const data = await this.utilizationService.compareRanges(this.userId, start, end);
>>>>>>> f4f7c53be921385c9c832f42bd2eff0a702db8a0
    return { data };
  }

  @Get("mock")
  mock() {
<<<<<<< HEAD
    return { message: "Mock endpoint still available" };
=======
    const mockInputs: UtilizationInput[] = [
      { spendCategory: SpendCategory.GROCERIES, budgetLimit: 400, currentSpend: 120 },
      { spendCategory: SpendCategory.RENT, budgetLimit: 1200, currentSpend: 1200 },
      { spendCategory: SpendCategory.ENTERTAINMENT, budgetLimit: 150, currentSpend: 190 },
      { spendCategory: SpendCategory.TRANSPORTATION, budgetLimit: 0, currentSpend: 50 },
    ];

    const { rows, alerts } = this.utilizationService.calculateRows(mockInputs);
    return { data: rows, alerts };
>>>>>>> f4f7c53be921385c9c832f42bd2eff0a702db8a0
  }
}