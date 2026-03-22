import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { SpendCategory } from "@prisma/client";

const isoDateString = z.string().refine((v) => !Number.isNaN(Date.parse(v)), {
  message: "startDate must be a valid ISO date string",
});

const CreateBudgetSchema = z.object({
  name: z.string().min(1).max(100),
  amount: z.number().positive(),
  spendCategory: z.nativeEnum(SpendCategory),
  startDate: isoDateString,
  isActive: z.boolean().optional(),
});

export class CreateBudgetDto extends createZodDto(CreateBudgetSchema) {}