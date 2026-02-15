import * as path from "path";
import {
  BadRequestException,
  Body,
  Controller,
  InternalServerErrorException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UnsupportedMediaTypeException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request } from "express";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { TransactionsService } from "./transactions.service";
import { UpdateSpendCategoryDto } from "./dto/update-spend-category.dto";
import type { ValidRow } from "./validation/transaction-csv.validator";
import { parseCibcCsv } from "./validation/transaction-csv.parser";
import { validateCibcRows } from "./validation/transaction-csv.validator";

function requireDigits(id: string) {
  if (!/^\d+$/.test(id)) {
    throw new BadRequestException("Invalid id format. Expected numeric id.");
  }
  return id;
}

function parsePositiveInt(value: string | undefined, fallback: number, name: string) {
  if (value === undefined) return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new BadRequestException(`${name} must be a positive integer`);
  }
  return n;
}

@Controller("transactions")
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post("upload-csv")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    }),
  )
  async uploadCsv(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
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

    const saved = await this.transactionsService.saveCsvRowsForUser(
      userId,
      validated,
    );

    const previewWithoutDescription = validated.slice(0, 10).map((row) => ({
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
      preview: previewWithoutDescription,
    };
    } catch (e: any) {
    // Preserve HttpExceptions thrown by parser/validator
    if (e?.getStatus) throw e;

    const msg = e?.message ?? "CSV upload failed";

    // Expected CSV/data issues → 400
    if (
      msg.toLowerCase().includes("csv") ||
      msg.toLowerCase().includes("row") ||
      msg.toLowerCase().includes("date") ||
      msg.toLowerCase().includes("amount")
    ) {
      throw new BadRequestException(msg);
    }

    // Anything else → controlled 500
    throw new InternalServerErrorException(msg);
  }
  }

  // GET /transactions → only my transactions
    @UseGuards(JwtAuthGuard)
  @Get()
  async listMine(
    @Req() req: Request,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    const user = req.user as { userId: string; email: string };

    const p = parsePositiveInt(page, 1, "page");
    const ps = parsePositiveInt(pageSize, 20, "pageSize");

    return this.transactionsService.listForUser(user.userId, p, ps);
    }

  // GET /transactions/:id → only if transaction belongs to me
  @UseGuards(JwtAuthGuard)
  @Get(":id")
  async getMine(@Param("id") id: string, @Req() req: Request) {
    requireDigits(id);
    const user = req.user as { userId: string; email: string };
    return this.transactionsService.getByIdForUser(id, user.userId);
  }

    // PATCH /transactions/:id/category → update spendCategory (only if mine)
  @UseGuards(JwtAuthGuard)
  @Patch(":id/category")
  async updateCategory(
    @Param("id") id: string,
    @Body() body: UpdateSpendCategoryDto,
    @Req() req: Request,
  ) {
    requireDigits(id);
    const user = req.user as { userId: string; email: string };

    return this.transactionsService.updateSpendCategoryForUser(
      id,
      user.userId,
      body.spendCategory,
    );
  }
}
