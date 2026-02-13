import { IsEnum } from "class-validator";
import { SpendCategory } from "@prisma/client";

export class UpdateSpendCategoryDto {
  @IsEnum(SpendCategory)
  spendCategory!: SpendCategory;
}