import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { SpendCategory } from "@prisma/client";

import { BudgetsService } from "./budgets.service";
import { UpdateBudgetDto } from "./dto/update-budget.dto";
import { CreateBudgetDto } from "./dto/create-budget.dto";

import { UtilizationService } from "./utilization/utilization.service";
import type { UtilizationInput } from "./utilization/utilization.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("budgets")
export class BudgetsController {
  constructor(
    private readonly budgetsService: BudgetsService,
    private readonly utilizationService: UtilizationService
  ) {}

  // TODO: Replace with real userId from JWT once auth guard is wired
  private readonly userId = BigInt(1);

  // ---------- helpers ----------
  private parseBigIntParam(value: string, paramName = "id"): bigint {
    if (!/^\d+$/.test(value)) {
      throw new BadRequestException(`${paramName} must be a valid integer`);
    }
    try {
      return BigInt(value);
    } catch {
      throw new BadRequestException(`${paramName} must be a valid integer`);
    }
  }

  private parseDateParam(value: string | undefined, name: string): Date {
    if (!value) throw new BadRequestException(`${name} query param is required`);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException(`${name} must be in YYYY-MM-DD format`);
    }

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

  // ---------- utilization endpoints (MUST be before :id) ----------
  @Get("utilization")
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

  @Get("utilization/compare")
  async compare(@Query("start") startStr: string, @Query("end") endStr: string) {
    const startDate = this.parseDateParam(startStr, "start");
    const endDate = this.parseDateParam(endStr, "end");

    const start = this.startOfDayUTC(startDate);
    const end = this.endOfDayUTC(endDate);

    if (start > end) throw new BadRequestException("start must be <= end");

    const data = await this.utilizationService.compareRanges(this.userId, start, end);
    return { data };
  }

  @Get("utilization/mock")
  mock() {
    const mockInputs: UtilizationInput[] = [
      { spendCategory: SpendCategory.GROCERIES, budgetLimit: 400, currentSpend: 120 },
      { spendCategory: SpendCategory.RENT, budgetLimit: 1200, currentSpend: 1200 },
      { spendCategory: SpendCategory.ENTERTAINMENT, budgetLimit: 150, currentSpend: 190 },
      { spendCategory: SpendCategory.TRANSPORTATION, budgetLimit: 0, currentSpend: 50 },
    ];

    const { rows, alerts } = this.utilizationService.calculateRows(mockInputs);
    return { data: rows, alerts };
  }

  // ---------- budgets CRUD ----------
  @Post()
  create(@Body() dto: CreateBudgetDto) {
    return this.budgetsService.create(this.userId, dto);
  }

  @Get()
  findAll() {
    return this.budgetsService.findAll(this.userId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    const budgetId = this.parseBigIntParam(id, "id");
    return this.budgetsService.findOne(this.userId, budgetId);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateBudgetDto) {
    const budgetId = this.parseBigIntParam(id, "id");
    return this.budgetsService.update(this.userId, budgetId, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    const budgetId = this.parseBigIntParam(id, "id");
    return this.budgetsService.remove(this.userId, budgetId);
  }
}