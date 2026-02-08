import {
  BadRequestException,
  Controller,
  InternalServerErrorException,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UnsupportedMediaTypeException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import * as fs from "fs";
import * as path from "path";
import type { Request } from "express";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function getUserIdOrThrow(req: Request): string {
  const user = (req as any).user;
  const userId = user?.userId ?? user?.sub ?? user?.id;
  if (!userId) throw new BadRequestException("Missing authenticated user.");
  return String(userId);
}

@Controller("statements")
export class StatementsController {
  @UseGuards(JwtAuthGuard)
  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 10 * 1024 * 1024 }, 
      storage: diskStorage({
        destination: (req, file, cb) => {
          try {
            const userId = getUserIdOrThrow(req as any);

            const uploadDir = path.join(process.cwd(), "uploads", String(userId));
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

            cb(null, uploadDir);
          } catch (e: any) {
            cb(new Error(e?.message ?? "Invalid upload destination"), "");
          }
        },
          filename: (req, file, cb) => {
            cb(null, `${Date.now()}-${safeName(file.originalname)}`);
          },
      }),
    }),
  )
  async uploadStatement(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
  try {
    if (!file) {
      throw new BadRequestException("File is required. Use form-data key: file");
    }

    const userId = getUserIdOrThrow(req);

    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".csv") {
      try {
        if ((file as any).path) fs.unlinkSync((file as any).path);
      } catch {

      }

      throw new UnsupportedMediaTypeException("Only .csv files are allowed.");
    }


    return {
      message: "File uploaded successfully.",
      userId: String(userId),
      originalFileName: file.originalname,
      storedFileName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      relativePath: `uploads/${userId}/${file.filename}`,
    };
      } catch (e: any) {
    if (e?.getStatus) throw e;

    const msg = e?.message ?? "Upload failed";

    if (msg.toLowerCase().includes("csv")) {
      throw new UnsupportedMediaTypeException(msg);
    }

    throw new InternalServerErrorException(msg);
  }
  }
}
