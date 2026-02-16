// backend/src/transactions/transactions.controller.ts

import * as path from "path";
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  Req,
  UnsupportedMediaTypeException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ZodValidationPipe } from "nestjs-zod";
import type { Request } from "express";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { TransactionsService } from "./transactions.service";
import type { ValidRow } from "./validation/transaction-csv.validator";
import { parseCibcCsv } from "./validation/transaction-csv.parser";
import { validateCibcRows } from "./validation/transaction-csv.validator";
import { UpdateCategoryDto } from "./dto/update-category.dto";

function requireDigits(id: string) {
  if (!/^\d+$/.test(id)) {
    throw new BadRequestException("Invalid id format. Expected numeric id.");
  }
  return id;
}

@Controller("transactions")
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  // POST /transactions/upload-csv
  @UseGuards(JwtAuthGuard)
  @Post("upload-csv")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    }),
  )
  async uploadCsv(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    try {
      if (!file) {
        throw new BadRequestException("CSV file is required");
      }

      const ext = path.extname(file.originalname).toLowerCase();
      if (ext !== ".csv") {
        throw new UnsupportedMediaTypeException("Only .csv files are allowed.");
      }

      const user = req.user as { userId: string; email: string };
      const userId = user?.userId;
      if (!userId) {
        throw new BadRequestException("Missing authenticated user.");
      }

      const rawRows = parseCibcCsv(file.buffer);
      const validated: ValidRow[] = validateCibcRows(rawRows);

      const saved = await this.transactionsService.saveCsvRowsForUser(userId, validated);

      const preview = validated.slice(0, 10).map((row) => ({
        transactionDate: row.transactionDate,
        amount: row.amount,
        transactionType: row.transactionType,
        cardLast4: row.cardLast4,
        source: row.source,
        currency: row.currency,
        description: row.description,
      }));

      return {
        message: "CIBC CSV validated and saved successfully",
        userId,
        rowsValidated: validated.length,
        rowsInserted: saved.inserted,
        preview,
      };
    } catch (e: any) {
      // Preserve HttpExceptions thrown by parser/validator
      if (e?.getStatus) throw e;

      const msg = e?.message ?? "CSV upload failed";

      // Expected CSV/data issues → 400
      const m = String(msg).toLowerCase();
      if (m.includes("csv") || m.includes("row") || m.includes("date") || m.includes("amount")) {
        throw new BadRequestException(msg);
      }

      // Anything else → controlled 500
      throw new InternalServerErrorException(msg);
    }
  }

  // GET /transactions → only my transactions
  @UseGuards(JwtAuthGuard)
  @Get()
  async listMine(@Req() req: Request) {
    const user = req.user as { userId: string; email: string };
    return this.transactionsService.listForUser(user.userId);
  }

  // GET /transactions/:id → only if transaction belongs to me
  @UseGuards(JwtAuthGuard)
  @Get(":id")
  async getMine(@Param("id") id: string, @Req() req: Request) {
    requireDigits(id);
    const user = req.user as { userId: string; email: string };
    return this.transactionsService.getByIdForUser(id, user.userId);
  }

  // PATCH /transactions/:id/category → update spendCategory (inline edit)
  @UseGuards(JwtAuthGuard)
  @Patch(":id/category")
  @UsePipes(ZodValidationPipe)
  async updateCategory(@Param("id") id: string, @Body() dto: UpdateCategoryDto, @Req() req: Request) {
    requireDigits(id);
    const user = req.user as { userId: string; email: string };
    return this.transactionsService.updateCategoryForUser(id, user.userId, dto.spendCategory);
  }
}