import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { SpendCategory } from '@prisma/client';

const UpdateBudgetSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  amount: z.number().positive().optional(),
  spendCategory: z.nativeEnum(SpendCategory).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
}).refine(
  (data) => !data.startDate || !data.endDate || new Date(data.endDate) >= new Date(data.startDate),
  { message: 'endDate must be >= startDate', path: ['endDate'] }
);

export class UpdateBudgetDto extends createZodDto(UpdateBudgetSchema) {}
