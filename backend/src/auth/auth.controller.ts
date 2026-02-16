import { Body, Controller, Post, Get, Req, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import type { Request } from "express";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

@Post("login")
@HttpCode(HttpStatus.OK)
login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
}

  @Get("me")
@UseGuards(JwtAuthGuard)
me(@Req() req: Request) {
return (req as any).user;
}

}
