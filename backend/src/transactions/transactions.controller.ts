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
  Query,
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

      const m = String(msg).toLowerCase();
      if (m.includes("csv") || m.includes("row") || m.includes("date") || m.includes("amount")) {
        throw new BadRequestException(msg);
      }

      // Anything else → controlled 500
      throw new InternalServerErrorException(msg);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async listMine(
    @Req() req: Request,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("q") q?: string,
    @Query("type") type?: string,
    @Query("fromDate") fromDate?: string,
    @Query("toDate") toDate?: string,
    @Query("category") category?: string,
  ) {
    const user = req.user as { userId: string; email: string };

    const p = parsePositiveInt(page, 1, "page");
    const ps = parsePositiveInt(pageSize, 20, "pageSize");

    return this.transactionsService.listForUser(user.userId, {
      page: p,
      pageSize: ps,
      q,
      type,
      fromDate,
      toDate,
      category,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id")
  async getMine(@Param("id") id: string, @Req() req: Request) {
    requireDigits(id);
    const user = req.user as { userId: string; email: string };
    return this.transactionsService.getByIdForUser(id, user.userId);
  }
)
  @UseGuards(JwtAuthGuard)
  @Patch(":id/category")
  @UsePipes(ZodValidationPipe)
  async updateCategory(
    @Param("id") id: string,
    @Body() dto: UpdateCategoryDto,
    @Req() req: Request,
  ) {
    requireDigits(id);
    const user = req.user as { userId: string; email: string };
    return this.transactionsService.updateSpendCategoryForUser(id, user.userId, dto.spendCategory);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  async updateMine(
    @Param("id") id: string,
    @Body() body: { spendCategory?: string },
    @Req() req: Request,
  ) {
    requireDigits(id);
    const user = req.user as { userId: string; email: string };

    if (!body?.spendCategory) {
      throw new BadRequestException("spendCategory is required");
    }

    return this.transactionsService.updateSpendCategoryForUser(id, user.userId, body.spendCategory);
  }
}