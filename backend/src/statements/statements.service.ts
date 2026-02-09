import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { StatementStatus, StatusResponse } from "./statement-status";

// TODO: replace with your real parser + db write calls
async function fakeParseAndSave(relativePath: string) {
  // simulate parse checks
  if (!relativePath.endsWith(".csv")) {
    throw new UnprocessableEntityException("Unsupported file format during parsing.");
  }
  return { transactionsInserted: 0 };
}

@Injectable()
export class StatementsService {
  async processUploadedStatement(params: {
    userId: string;
    originalFileName: string;
    storedFileName: string;
    relativePath: string;
    size: number;
    mimeType: string;
  }): Promise<StatusResponse> {

    const base: StatusResponse = {
      status: StatementStatus.UPLOADED,
      message: "File stored. Starting parsing.",
      statement: { ...params },
    };

 
    try {  

      const result = await fakeParseAndSave(params.relativePath);

      return {
        ...base,
        status: StatementStatus.COMPLETED,
        message: "Statement processed successfully.",
        details: result,
      };
    } catch (e: any) {
      return {
        ...base,
        status: StatementStatus.FAILED,
        message: e?.message ?? "Processing failed.",
      };
    }
  }
}
