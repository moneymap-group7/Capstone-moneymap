import { Module } from "@nestjs/common";
import { AutoCategorizeService } from "./categorization/auto-categorize.service";
import { CategoryResolverService } from "./categorization/category-resolver/category-resolver.service";
import { RulesModule } from "../rules/rules.module";

@Module({
  imports: [RulesModule],
  providers: [AutoCategorizeService, CategoryResolverService],
  exports: [AutoCategorizeService, CategoryResolverService],
})
export class CommonModule {}