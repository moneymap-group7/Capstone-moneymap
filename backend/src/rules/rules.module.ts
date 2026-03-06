import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { RulesController } from "./rules.controller";
import { RulesService } from "./rules.service";

@Module({
  imports: [PrismaModule],
  controllers: [RulesController],
  providers: [RulesService],
  exports: [RulesService],
})
export class RulesModule {}