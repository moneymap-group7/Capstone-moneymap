import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RulesService } from "./rules.service";
import { CreateRuleDto } from "./dto/create-rule.dto";
import { UpdateRuleDto } from "./dto/update-rule.dto";

@Controller("rules")
@UseGuards(JwtAuthGuard)
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreateRuleDto) {
    const user = (req as any).user;
    return this.rulesService.create(user.userId, dto);
  }

  @Get()
  findAll(@Req() req: Request) {
    const user = (req as any).user;
    return this.rulesService.findAll(user.userId);
  }

  @Patch(":id")
  update(@Req() req: Request, @Param("id") id: string, @Body() dto?: UpdateRuleDto) {
    const user = (req as any).user;
    return this.rulesService.update(user.userId, id, dto ?? {});
  }

  @Delete(":id")
  remove(@Req() req: Request, @Param("id") id: string) {
    const user = (req as any).user;
    return this.rulesService.remove(user.userId, id);
  }
}