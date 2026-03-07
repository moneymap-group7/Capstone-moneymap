import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { RulesService } from "./rules.service";
import { CreateRuleDto } from "./dto/create-rule.dto";
import { UpdateRuleDto } from "./dto/update-rule.dto";

@Controller("rules")
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Post()
  create(@Body() dto: CreateRuleDto) {
    return this.rulesService.create(dto);
  }

  @Get()
  findAll(@Query("userId") userId: string) {
    return this.rulesService.findAll(Number(userId));
  }

  @Patch(":id")
update(@Param("id") id: string, @Body() dto?: UpdateRuleDto) {
  return this.rulesService.update(id, dto ?? {});
}

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.rulesService.remove(id);
  }
}