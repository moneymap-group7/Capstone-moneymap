import { Injectable, InternalServerErrorException } from "@nestjs/common";
import * as nodemailer from "nodemailer";

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT || 587),
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  async sendVerificationEmail(email: string, code: string) {
    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: email,
        subject: "MoneyMap Email Verification Code",
        text: `Your MoneyMap verification code is: ${code}. It expires in 10 minutes.`,
        html: `<p>Your MoneyMap verification code is: <b>${code}</b></p><p>It expires in 10 minutes.</p>`,
      });
    } catch (error) {
      console.error("Failed to send verification email:", error);
      throw new InternalServerErrorException("Failed to send verification email");
    }
  }


    async sendPasswordResetEmail(email: string, code: string) {
    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: email,
        subject: "MoneyMap Password Reset Code",
        text: `Your MoneyMap password reset code is: ${code}. It expires in 10 minutes.`,
        html: `<p>Your MoneyMap password reset code is: <b>${code}</b></p><p>It expires in 10 minutes.</p>`,
      });
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      throw new InternalServerErrorException("Failed to send password reset email");
    }
  }

}