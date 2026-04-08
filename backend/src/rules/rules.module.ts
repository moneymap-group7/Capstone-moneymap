import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { RulesController } from "./rules.controller";
import { RulesService } from "./rules.service";
import { RuleEngineService } from "./rule-engine/rule-engine.service";

@Module({
  imports: [PrismaModule],
  controllers: [RulesController],
  providers: [RulesService, RuleEngineService],
  exports: [RulesService, RuleEngineService],
})
export class RulesModule {}