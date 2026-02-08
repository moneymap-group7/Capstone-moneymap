import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const timestamp = new Date().toISOString();
    const path = req.url;

    // 1) Known Nest HttpExceptions (BadRequestException, etc.)
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Nest can return string OR object
      let message: any = "Request failed";
      let errorText: string | undefined;

      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
        errorText = HttpStatus[statusCode] ?? "Error";
      } else if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
        const r: any = exceptionResponse;

        // keep existing message shape if it's already an array/object
        message = r.message ?? r;
        errorText = r.error ?? HttpStatus[statusCode] ?? "Error";
      }

      return res.status(statusCode).json({
        statusCode,
        error: errorText,
        message,
        path,
        timestamp,
      });
    }

    // 2) Unknown errors (plain Error, runtime crash)
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
