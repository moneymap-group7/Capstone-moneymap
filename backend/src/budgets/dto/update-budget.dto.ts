import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { SpendCategory } from '@prisma/client';
const isoDateOptional = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), {
    message: 'must be a valid ISO date string',
  })
  .optional();
const UpdateBudgetSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    amount: z.number().positive().optional(),
    spendCategory: z.nativeEnum(SpendCategory).optional(),
    startDate: isoDateOptional,
    endDate: isoDateOptional,
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) =>
      !data.startDate ||
      !data.endDate ||
      Date.parse(data.endDate) >= Date.parse(data.startDate),
    { message: 'endDate must be >= startDate', path: ['endDate'] },
  );

export class UpdateBudgetDto extends createZodDto(UpdateBudgetSchema) {}
