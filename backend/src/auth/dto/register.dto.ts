import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .refine((v) => v.trim() === v, "Password cannot start or end with spaces")
  .refine((v) => /[A-Za-z]/.test(v), "Password must include at least 1 letter")
  .refine((v) => /\d/.test(v), "Password must include at least 1 number");

export const RegisterSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must be at most 100 characters"),
    email: z.string().trim().toLowerCase().email("Invalid email"),
    password: passwordSchema,
  })
  .strict(); // blocks extra fields like role:"admin"

export class RegisterDto extends createZodDto(RegisterSchema) {}
