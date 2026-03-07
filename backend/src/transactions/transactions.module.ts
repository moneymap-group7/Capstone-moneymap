import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { TransactionsController } from "./transactions.controller";
import { TransactionsService } from "./transactions.service";
import { CommonModule } from "../common/common.module";

@Module({
  imports: [PrismaModule, CommonModule],
import { CommonModule } from "../common/common.module";

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
