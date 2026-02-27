export enum StatementStatus {
  UPLOADED = "UPLOADED",
  PARSING = "PARSING",
  FAILED = "FAILED",
  COMPLETED = "COMPLETED",
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
};

export type StatusResponse = {
  status: StatementStatus;
  message: string;
  statement: StatementMeta;
  details?: StatementDetails;
};
