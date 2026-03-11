import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { ForgotPasswordRequestDto } from "./dto/forgot-password-request.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { JwtService } from "@nestjs/jwt";
import { MailService } from "../mail/mail.service";

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  private generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateVerificationExpiry() {
    return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.prisma.user.findUnique({ where: { email } });
    

    const verificationCode = this.generateVerificationCode();
    const verificationExpiry = this.generateVerificationExpiry();
    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    if (existing) {
      if (existing.isEmailVerified) {
        throw new BadRequestException("Email already registered");
      }

      await this.prisma.user.update({
        where: { email },
        data: {
          fullName: dto.fullName,
          passwordHash,
          emailVerificationCode: verificationCode,
          emailVerificationExpiresAt: verificationExpiry,
        },
      });

      // console.log("Verification code for", email, "is", verificationCode);
      await this.mailService.sendVerificationEmail(email, verificationCode);

      return {
        message: "Verification code sent to your email",
        email,
      };
    }


    const created = await this.prisma.user.create({
  data: {
    fullName: dto.fullName,
    email,
    passwordHash,
    isEmailVerified: false,
    emailVerificationCode: verificationCode,
    emailVerificationExpiresAt: verificationExpiry,
  },
  select: {
    userId: true,
    fullName: true,
    email: true,
    createdAt: true,
  },
});

// console.log("Verification code for", email, "is", verificationCode);
await this.mailService.sendVerificationEmail(email, verificationCode);

 return {
      message: "Verification code sent to your email",
      user: {
        ...created,
        userId: created.userId.toString(),
      },
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const email = dto.email.trim().toLowerCase();
    const code = dto.code.trim();

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new BadRequestException("User not found");
    }

    if (user.isEmailVerified) {
      return { message: "Email already verified" };
    }

    if (!user.emailVerificationCode || !user.emailVerificationExpiresAt) {
      throw new BadRequestException("No verification code found");
    }

    if (user.emailVerificationCode !== code) {
      throw new BadRequestException("Invalid verification code");
    }

    if (new Date() > new Date(user.emailVerificationExpiresAt)) {
      throw new BadRequestException("Verification code has expired");
    }

    await this.prisma.user.update({
      where: { email },
      data: {
        isEmailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
      },
    });

    return { message: "Email verified successfully" };
  }



  async requestPasswordReset(dto: ForgotPasswordRequestDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({ where: { email } });

    // Generic response so users cannot check which emails exist
    if (!user || !user.isEmailVerified) {
      return {
        message: "If an account exists for this email, a reset code has been sent",
      };
    }

    const resetCode = this.generateVerificationCode();
    const resetExpiry = this.generateVerificationExpiry();

    await this.prisma.user.update({
      where: { email },
      data: {
        passwordResetCode: resetCode,
        passwordResetExpiresAt: resetExpiry,
        passwordResetUsedAt: null,
      },
    });

    await this.mailService.sendPasswordResetEmail(email, resetCode);

    return {
      message: "If an account exists for this email, a reset code has been sent",
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const code = dto.code.trim();

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new BadRequestException("Invalid email or reset code");
    }

    if (!user.passwordResetCode || !user.passwordResetExpiresAt) {
      throw new BadRequestException("No password reset request found");
    }

    if (user.passwordResetUsedAt) {
      throw new BadRequestException("This reset code has already been used");
    }

    if (user.passwordResetCode !== code) {
      throw new BadRequestException("Invalid email or reset code");
    }

    if (new Date() > new Date(user.passwordResetExpiresAt)) {
      throw new BadRequestException("Reset code has expired");
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, this.SALT_ROUNDS);

    await this.prisma.user.update({
      where: { email },
      data: {
        passwordHash,
        passwordResetCode: null,
        passwordResetExpiresAt: null,
        passwordResetUsedAt: new Date(),
      },
    });

    return {
      message: "Password reset successful",
    };
  }

async login(dto: LoginDto) {
  const email = dto.email.trim().toLowerCase();

  const user = await this.prisma.user.findUnique({ where: { email } });
  if (!user) throw new UnauthorizedException("Invalid credentials");

  const ok = await bcrypt.compare(dto.password, user.passwordHash);
  if (!ok) throw new UnauthorizedException("Invalid credentials");


  if (!user.isEmailVerified) {
      throw new UnauthorizedException("Please verify your email before logging in");
    }

  const accessToken = this.jwtService.sign({
  sub: user.userId.toString(),  
  email: user.email,
});

return { accessToken };
}
}
