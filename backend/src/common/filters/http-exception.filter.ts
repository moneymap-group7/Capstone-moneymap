import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";

type PrismaKnownError = {
  code?: string;
  message?: string;
};

function extractMessage(exceptionResponse: any) {
  if (typeof exceptionResponse === "string") return exceptionResponse;

  if (exceptionResponse && typeof exceptionResponse === "object") {
    const msg = exceptionResponse.message ?? exceptionResponse.errors;

    if (Array.isArray(msg)) return msg;
    if (typeof msg === "string" && msg !== "Validation failed") return msg;

    
    const zodErrors = exceptionResponse.errors;
    if (Array.isArray(zodErrors)) {
      const formatted = zodErrors.map((e: any) => {
        const p = Array.isArray(e.path) ? e.path.join(".") : e.path;
        const m = e.message ?? "Invalid value";
        return p ? `${p}: ${m}` : m;
      });
      if (formatted.length) return formatted;
    }

    return exceptionResponse;
  }

  return "Request failed";
}

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const timestamp = new Date().toISOString();
    const path = req.url;

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      const message = extractMessage(exceptionResponse);
      const errorText =
        typeof exceptionResponse === "object" && exceptionResponse !== null
          ? (exceptionResponse as any).error ?? HttpStatus[statusCode] ?? "Error"
          : HttpStatus[statusCode] ?? "Error";

      return res.status(statusCode).json({
        statusCode,
        error: errorText,
        message,
        path,
        timestamp,
      });
    }

    const prismaError = exception as PrismaKnownError;

    if (prismaError?.code === "P2025") {
      return res.status(HttpStatus.NOT_FOUND).json({
        statusCode: 404,
        error: "Not Found",
        message: "Resource not found",
        path,
        timestamp,
      });
    }

    if (prismaError?.code === "P2002") {
      return res.status(HttpStatus.CONFLICT).json({
        statusCode: 409,
        error: "Conflict",
        message: "Duplicate resource",
        path,
        timestamp,
      });
    }

    const msg =
      exception instanceof Error ? exception.message : "Internal server error";

    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: 500,
      error: "Internal Server Error",
      message: msg || "Internal server error",
      path,
      timestamp,
    });
  }
}