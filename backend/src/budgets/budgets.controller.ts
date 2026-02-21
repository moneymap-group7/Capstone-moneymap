import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { BudgetsService } from "./budgets.service";
import { UpdateBudgetDto } from "./dto/update-budget.dto";
import { CreateBudgetDto } from "./dto/create-budget.dto";

@Controller("budgets")
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  // TODO: Replace with real userId from JWT (req.user.userId) once auth guard is wired
  private readonly userId = BigInt(1);

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