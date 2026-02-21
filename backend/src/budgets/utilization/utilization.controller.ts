import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import { UtilizationService } from "./utilization.service";
import type { UtilizationInput } from "./utilization.types";

@Controller("budgets/utilization")
export class UtilizationController {
  constructor(private readonly utilizationService: UtilizationService) {}

  // TODO: Replace with real userId from JWT once auth guard is wired
  private readonly userId = BigInt(1);

  private parseDateParam(value: string | undefined, name: string): Date {
    if (!value) throw new BadRequestException(`${name} query param is required`);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException(`${name} must be in YYYY-MM-DD format`);
    }

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestException(`${name} is not a valid date`);
    }
    return d;
  }

  @Get()
  async utilization(@Query("start") startStr: string, @Query("end") endStr: string) {
    const startDate = this.parseDateParam(startStr, "start");
    const endDate = this.parseDateParam(endStr, "end");

    const start = new Date(`${startStr}T00:00:00.000Z`);
    const end = new Date(`${endStr}T23:59:59.999Z`);

    if (start > end) throw new BadRequestException("start must be <= end");

    const data = await this.utilizationService.getUtilizationForRange(
      this.userId,
      start,
      end
    );

    return { data };
  }

  @Get("compare")
  async compare(@Query("start") startStr: string, @Query("end") endStr: string) {
    this.parseDateParam(startStr, "start");
    this.parseDateParam(endStr, "end");

    const start = new Date(`${startStr}T00:00:00.000Z`);
    const end = new Date(`${endStr}T23:59:59.999Z`);

    if (start > end) throw new BadRequestException("start must be <= end");

    const data = await this.utilizationService.compareRanges(this.userId, start, end);

    return { data };
  }

  @Get("mock")
  mock() {
    const mockInputs: UtilizationInput[] = [
      { spendCategory: "GROCERIES", budgetLimit: 400, currentSpend: 120 },
      { spendCategory: "RENT", budgetLimit: 1200, currentSpend: 1200 },
      { spendCategory: "ENTERTAINMENT", budgetLimit: 150, currentSpend: 190 },
      { spendCategory: "TRANSPORTATION", budgetLimit: 0, currentSpend: 50 },
    ];

    return { data: this.utilizationService.calculateRows(mockInputs) };
  }
}