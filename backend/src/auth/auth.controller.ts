import { Body, Controller, Post, UsePipes, Get, Req, UseGuards } from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import type { Request } from "express";

@Controller("auth")
@UsePipes(ZodValidationPipe)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get("me")
@UseGuards(JwtAuthGuard)
me(@Req() req: Request) {
return (req as any).user;
}

}
