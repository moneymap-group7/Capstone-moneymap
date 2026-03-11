import { IsEmail, IsString, Matches, MinLength } from "class-validator";

export class ResetPasswordDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: "Code must be 6 digits" })
  code!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}