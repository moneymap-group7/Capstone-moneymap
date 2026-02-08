import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request } from "express";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { TransactionsService } from "./transactions.service";
import type { ValidRow } from "./validation/transaction-csv.validator";
import { parseCibcCsv } from "./validation/transaction-csv.parser";
import { validateCibcRows } from "./validation/transaction-csv.validator";

@Controller("transactions")
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post("upload-csv")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
      fileFilter: (req, file, cb) => {
        if (!file.originalname.toLowerCase().endsWith(".csv")) {
          return cb(new BadRequestException("Only .csv files are allowed"), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadCsv(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException("CSV file is required");

    // ✅ userId comes from JWT (User Linking)
    const user = req.user as { userId: string; email: string };
    const userId = user.userId;

    const rawRows = parseCibcCsv(file.buffer);
    const validated: ValidRow[] = validateCibcRows(rawRows);
    const saved = await this.transactionsService.saveCsvRowsForUser(userId, validated);

    const previewWithoutDescription = validated.slice(0, 10).map((row) => ({
      transactionDate: row.transactionDate,
      amount: row.amount,
      transactionType: row.transactionType,
      cardLast4: row.cardLast4,
      source: row.source,
      currency: row.currency,
      label: row.label,
    }));

    return {
      message: "CIBC CSV validated and saved successfully",
      userId,
      rowsValidated: validated.length,
      rowsInserted: saved.inserted,
      preview: previewWithoutDescription,
    };
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
    const user = req.user as { userId: string; email: string };
    return this.transactionsService.getByIdForUser(id, user.userId);
  }
}
