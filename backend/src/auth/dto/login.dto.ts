import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const LoginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Invalid email"),
    password: z.string().min(1, "Password is required"),
  })
  .strict();

export class LoginDto extends createZodDto(LoginSchema) {}
