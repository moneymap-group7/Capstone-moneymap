import { BadRequestException } from '@nestjs/common';
import { parse } from 'csv-parse/sync';

export type CibcRawRow = {
  date: string;         // YYYY-MM-DD
  description: string;  // merchant text (raw)
  debit: string;        // number or ""
  credit: string;       // number or ""
  cardMasked: string;   // last4 somewhere
};

export function parseCibcCsv(fileBuffer: Buffer): CibcRawRow[] {
  try {
    const text = fileBuffer.toString('utf8');

    // Many CIBC exports are "no header" and fixed column count
    const records = parse(text, {
      columns: false,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      bom: true,
    }) as string[][];

    if (!Array.isArray(records) || records.length === 0) {
      throw new BadRequestException('CSV is empty.');
    }

    // Expect 5 columns: Date, Description, Debit, Credit, Card
    for (let i = 0; i < records.length; i++) {
      const cols = records[i];
      if (!Array.isArray(cols) || cols.length !== 5) {
        throw new BadRequestException(
          `Invalid CIBC CSV format at row ${i + 1}: expected 5 columns, got ${cols?.length ?? 0}`,
        );
      }
    }

    return records.map((r) => ({
      date: r[0],
      description: r[1],
      debit: r[2],
      credit: r[3],
      cardMasked: r[4],
    }));
  } catch (e: any) {
    if (e?.getStatus && e.getStatus() === 400) throw e;
    throw new BadRequestException(`Invalid CSV format: ${e?.message ?? 'Unknown error'}`);
  }
}
