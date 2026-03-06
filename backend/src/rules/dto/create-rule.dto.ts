import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { SpendCategory, TransactionType } from "@prisma/client";

export class CreateRuleDto {
  @IsInt()
  @Min(1)
  userId!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @IsOptional()
  @IsString()
  merchantContains?: string;

  @IsOptional()
  @IsString()
  merchantEquals?: string;

  // Decimal safe as string (avoid float rounding issues)
  @IsOptional()
  @IsString()
  minAmount?: string;

  @IsOptional()
  @IsString()
  maxAmount?: string;

  @IsOptional()
  @IsEnum(TransactionType)
  transactionType?: TransactionType;

  @IsEnum(SpendCategory)
  spendCategory!: SpendCategory;
}