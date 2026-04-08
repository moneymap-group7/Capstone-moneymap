import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { SpendCategory } from "@prisma/client";

const isoDateOptional = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), {
    message: "startDate must be a valid ISO date string",
  })
  .optional();

const UpdateBudgetSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  amount: z.number().positive().optional(),
  spendCategory: z.nativeEnum(SpendCategory).optional(),
  startDate: isoDateOptional,
  isActive: z.boolean().optional(),
});

export class UpdateBudgetDto extends createZodDto(UpdateBudgetSchema) {}