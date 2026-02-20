import { z } from "zod";
import { createZodDto } from "nestjs-zod";

export const UtilizationQuerySchema = z.object({
  start: z.string().min(1), // YYYY-MM-DD
  end: z.string().min(1),   // YYYY-MM-DD
});

export class UtilizationQueryDto extends createZodDto(UtilizationQuerySchema) {}