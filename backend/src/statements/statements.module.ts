import { Module } from "@nestjs/common";
import { StatementsController } from "./statements.controller";
import { StatementsService } from "./statements.service";
import { PrismaService } from "../prisma/prisma.service";
import { ParsingModule } from "../parsing/parsing.module";

@Module({
  imports: [ParsingModule],
  controllers: [StatementsController],
  providers: [
    StatementsService,
    PrismaService,
  ],
})
export class StatementsModule {}