import { Body, Controller, Post } from '@nestjs/common';
import { CreateBudgetDto } from './dto/create-budget.dto';

@Controller('budgets')
export class BudgetsController {
  
  @Post()
  create(@Body() dto: CreateBudgetDto) {
    return dto;
  }
}
