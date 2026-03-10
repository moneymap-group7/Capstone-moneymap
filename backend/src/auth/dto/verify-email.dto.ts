import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const VerifyEmailSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Invalid email"),
    code: z.string().trim().length(6, "Verification code must be 6 digits"),
  })
  .strict();

export class VerifyEmailDto extends createZodDto(VerifyEmailSchema) {}