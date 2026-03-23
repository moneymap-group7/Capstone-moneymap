import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { ParsingModule } from "../parsing/parsing.module";
import { CommonModule } from "../common/common.module";

import { StatementsController } from "./statements.controller";
import { StatementsService } from "./statements.service";
import { StatementsAdminService } from "./statements-admin.service";

@Module({
  imports: [PrismaModule, ParsingModule, CommonModule],
  controllers: [StatementsController],
  providers: [StatementsService, StatementsAdminService],
  exports: [StatementsService, StatementsAdminService],
})
export class StatementsModule {}