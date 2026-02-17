import { Controller, Get } from '@nestjs/common';

@Controller('categories')
export class CategoriesController {
  @Get()
  getCategories() {
    return [
      'FOOD_AND_DINING',
      'GROCERIES',
      'TRANSPORTATION',
      'SHOPPING',
      'UTILITIES',
      'RENT',
      'ENTERTAINMENT',
      'HEALTH',
      'EDUCATION',
      'TRAVEL',
      'FEES',
      'INCOME',
      'TRANSFER',
      'OTHER',
      'UNCATEGORIZED',
    ];
  }
}
