import { IsArray, ArrayNotEmpty, IsString } from "class-validator";

export class DeleteTransactionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  transactionIds: string[];
}