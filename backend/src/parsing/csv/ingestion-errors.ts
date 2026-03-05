import { BankId } from "./bank-id.types";

export type IngestionErrorCode =
  | "UNSUPPORTED_BANK"
  | "EMPTY_FILE"
  | "INVALID_CSV"
  | "PARSER_FAILED"
  | "VALIDATION_FAILED";

export class IngestionError extends Error {
  readonly code: IngestionErrorCode;
  readonly bank?: BankId;
  readonly details?: Record<string, any>;

  constructor(
    code: IngestionErrorCode,
    message: string,
    opts?: { bank?: BankId; details?: Record<string, any> }
  ) {
    super(message);
    this.code = code;
    this.bank = opts?.bank;
    this.details = opts?.details;
  }
}

export function isIngestionError(e: unknown): e is IngestionError {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    typeof (e as any).code === "string" &&
    e instanceof Error
  );
}