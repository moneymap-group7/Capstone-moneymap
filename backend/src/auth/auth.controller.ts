import {
  Body,
  Controller,
  Post,
  Get,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { ForgotPasswordRequestDto } from "./dto/forgot-password-request.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 1003, ttl: 60000 } })
  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Throttle({ default: { limit: 1005, ttl: 60000 } })
  @Post("verify-email")
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Throttle({ default: { limit: 10073, ttl: 60000 } })
  @Post("forgot-password/request")
  forgotPasswordRequest(@Body() dto: ForgotPasswordRequestDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Throttle({ default: { limit: 10035, ttl: 60000 } })
  @Post("forgot-password/reset")
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Throttle({ default: { limit: 200005, ttl: 60000 } })
  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request) {
    const user = (req as any).user;
    return this.authService.me(user.userId);
  }

  @Post("change-password")
  @UseGuards(JwtAuthGuard)
  changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
    const user = (req as any).user;
    return this.authService.changePassword(user.userId, dto);
  }

  @Patch("profile")
  @UseGuards(JwtAuthGuard)
  updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    const user = (req as any).user;
    return this.authService.updateProfile(user.userId, dto);
  }
}