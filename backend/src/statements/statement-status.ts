export enum StatementStatus {
  UPLOADED = "UPLOADED",
  PARSING = "PARSING",
  FAILED = "FAILED",
  COMPLETED = "COMPLETED",
}

export type StatusResponse = {
  status: StatementStatus;
  message: string;
  statement: {
    userId: string;
    originalFileName: string;
    storedFileName: string;
    relativePath: string;
    size: number;
    mimeType: string;
  };
  details?: any;
};
