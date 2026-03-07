import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { TransactionsController } from "./transactions.controller";
import { TransactionsService } from "./transactions.service";
<<<<<<< HEAD
import { CommonModule } from "../common/common.module";

@Module({
  imports: [PrismaModule, CommonModule],
=======

@Module({
  imports: [PrismaModule],
>>>>>>> origin/main
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
