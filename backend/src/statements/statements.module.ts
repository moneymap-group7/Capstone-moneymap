import { Module } from "@nestjs/common";
import { StatementsController } from "./statements.controller";
import { StatementsService } from "./statements.service";
import { PrismaModule } from "../prisma/prisma.module";
import { ParsingModule } from "../parsing/parsing.module";
import { CommonModule } from "../common/common.module";

@Module({
  imports: [PrismaModule, ParsingModule, CommonModule],
  controllers: [StatementsController],
  providers: [
    StatementsService,
  ],
})
export class StatementsModule {}