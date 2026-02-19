import { Module } from "@nestjs/common";
import { StatementsController } from "./statements.controller";
import { StatementsService } from "./statements.service";
import { PrismaService } from "../prisma/prisma.service";
import { CibcCsvParserService } from "../parsing/csv/cibc-csv-parser.service";

@Module({
  controllers: [StatementsController],
  providers: [
    StatementsService,
    PrismaService,
    CibcCsvParserService,
  ],
})
export class StatementsModule {}