import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  ParseIntPipe,
} from "@nestjs/common";
import { BudgetsService } from "./budgets.service";
import { UpdateBudgetDto } from "./dto/update-budget.dto";
import { CreateBudgetDto } from "./dto/create-budget.dto";

@Controller("budgets")
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  private readonly userId = BigInt(1);

  @Post()
  create(@Body() dto: CreateBudgetDto) {
    return this.budgetsService.create(this.userId, dto);
  }

  @Get()
  findAll() {
    return this.budgetsService.findAll(this.userId);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.budgetsService.findOne(this.userId, BigInt(id));
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateBudgetDto
  ) {
    return this.budgetsService.update(this.userId, BigInt(id), dto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.budgetsService.remove(this.userId, BigInt(id));
  }
}