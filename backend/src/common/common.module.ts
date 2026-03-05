import { Module } from "@nestjs/common";
import { AutoCategorizeService } from "./categorization/auto-categorize.service";

@Module({
  providers: [AutoCategorizeService],
  exports: [AutoCategorizeService],
})
export class CommonModule {}