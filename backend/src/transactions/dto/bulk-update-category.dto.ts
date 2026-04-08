import { z } from "zod";

export const bulkUpdateCategorySchema = z.object({
  transactionIds: z.array(z.string().regex(/^\d+$/, "Each transactionId must be numeric")).min(1),
  spendCategory: z.string().min(1, "spendCategory is required"),
});

export type BulkUpdateCategoryDto = z.infer<typeof bulkUpdateCategorySchema>;