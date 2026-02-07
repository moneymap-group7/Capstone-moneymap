import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { parseCibcCsv } from './validation/transaction-csv.parser';
import { validateCibcRows } from './validation/transaction-csv.validator';

@Controller('transactions')
export class TransactionsController {
  @UseGuards(JwtAuthGuard)
  @Post('upload-csv')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
      fileFilter: (req, file, cb) => {
        if (!file.originalname.toLowerCase().endsWith('.csv')) {
          return cb(new BadRequestException('Only .csv files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadCsv(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('CSV file is required');

    const rawRows = parseCibcCsv(file.buffer);
    const validated = validateCibcRows(rawRows);


    const previewWithoutDescription = validated.slice(0, 10).map((row) => ({
      transactionDate: row.transactionDate,
      amount: row.amount,
      transactionType: row.transactionType,
      cardLast4: row.cardLast4,
      source: row.source,
      currency: row.currency,
      // optional: show generic label
      label: row.label,
    }));

    return {
      message: 'CIBC CSV validated successfully',
      rows: validated.length,
      preview: previewWithoutDescription,
    };
  }
}
