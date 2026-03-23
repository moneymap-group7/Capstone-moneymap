import type { IngestionErrorCode } from "../parsing/csv/ingestion-errors";

export enum StatementStatus {
  UPLOADED = "UPLOADED",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export type StatementMeta = {
  userId: string;
  originalFileName: string;
  storedFileName: string;
  relativePath: string;
  size: number;
  mimeType: string;
};
export type StatementDetails = {
  bank: string | null;
  transactionsInserted: number;

  errorCode?: IngestionErrorCode | null;

  supportedBanks?: string[];
  totalErrors?: number;
  errors?: string[];
};

export type StatusResponse = {
  status: StatementStatus;
  message: string;
  statement: StatementMeta;
  details?: StatementDetails;
};
