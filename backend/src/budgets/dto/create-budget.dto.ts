import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { SpendCategory } from "@prisma/client";

const isoDateString = z.string().refine((v) => !Number.isNaN(Date.parse(v)), {
  message: "startDate must be a valid ISO date string",
});

const optionalIsoDateString = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), {
    message: "endDate must be a valid ISO date string",
  })
  .optional();

const CreateBudgetSchema = z
  .object({
    name: z.string().min(1).max(100),
    amount: z.number().positive(),
    spendCategory: z.nativeEnum(SpendCategory), // ✅ FIX
    startDate: isoDateString,
    endDate: optionalIsoDateString,
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => !data.endDate || Date.parse(data.endDate) >= Date.parse(data.startDate),
    { message: "endDate must be >= startDate", path: ["endDate"] }
  );

export class CreateBudgetDto extends createZodDto(CreateBudgetSchema) {}