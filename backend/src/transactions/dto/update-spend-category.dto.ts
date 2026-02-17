import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { SpendCategory } from "@prisma/client";

const SpendCategoryValues = Object.values(SpendCategory) as string[];

export const UpdateSpendCategorySchema = z.object({
  spendCategory: z
    .string()
    .refine((v) => SpendCategoryValues.includes(v), "Invalid spend category")
    .transform((v) => v as SpendCategory),
});

export class UpdateSpendCategoryDto extends createZodDto(
  UpdateSpendCategorySchema,
) {}