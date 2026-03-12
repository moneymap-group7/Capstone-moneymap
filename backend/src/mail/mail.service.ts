import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { Resend } from "resend";

@Injectable()
export class MailService {
    private readonly resend = new Resend(process.env.RESEND_API_KEY);

  async sendVerificationEmail(email: string, code: string) {
    try {
        const { error } = await this.resend.emails.send({
        from: process.env.MAIL_FROM as string,
        to: email,
        subject: "MoneyMap Email Verification Code",
        text: `Your MoneyMap verification code is: ${code}. It expires in 10 minutes.`,
        html: `<p>Your MoneyMap verification code is: <b>${code}</b></p><p>It expires in 10 minutes.</p>`,
      });

      if (error) {
        console.error("Failed to send verification email:", error);
        throw new InternalServerErrorException("Failed to send verification email");
      }
    } catch (error) {
      console.error("Failed to send verification email:", error);
      throw new InternalServerErrorException("Failed to send verification email");
    }
  }


    async sendPasswordResetEmail(email: string, code: string) {
    try {
            const { error } = await this.resend.emails.send({
        from: process.env.MAIL_FROM as string,
        to: email,
        subject: "MoneyMap Password Reset Code",
        text: `Your MoneyMap password reset code is: ${code}. It expires in 10 minutes.`,
        html: `<p>Your MoneyMap password reset code is: <b>${code}</b></p><p>It expires in 10 minutes.</p>`,
      });

      if (error) {
        console.error("Failed to send password reset email:", error);
        throw new InternalServerErrorException("Failed to send password reset email");
      }
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      throw new InternalServerErrorException("Failed to send password reset email");
    }
  }

}