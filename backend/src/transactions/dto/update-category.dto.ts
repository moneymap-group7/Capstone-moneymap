import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { SpendCategory } from "@prisma/client";

export const UpdateCategorySchema = z.object({
  spendCategory: z.nativeEnum(SpendCategory),
});

export class UpdateCategoryDto extends createZodDto(UpdateCategorySchema) {}