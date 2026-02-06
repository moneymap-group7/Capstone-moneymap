import {
  BadRequestException,
  Controller,
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

@Controller("statements")
export class StatementsController {
  @UseGuards(JwtAuthGuard)
  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== ".csv") {
          return cb(
            new UnsupportedMediaTypeException("Only .csv files are allowed."),
            false,
          );
        }
        cb(null, true);
      },
      storage: diskStorage({
        destination: (req, file, cb) => {
          const user = (req as any).user;
          const userId = user?.userId ?? user?.sub ?? user?.id;

          if (!userId) {
            return cb(new BadRequestException("Missing authenticated user."), "");
          }

          // This will create: backend/uploads/<userId>/
          const uploadDir = path.join(process.cwd(), "uploads", String(userId));
          if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          cb(null, `${Date.now()}-${safeName(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadStatement(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) {
      throw new BadRequestException("File is required. Use form-data key: file");
    }

    const user = (req as any).user;
    const userId = user?.userId ?? user?.sub ?? user?.id;
    if (!userId) throw new BadRequestException("Missing authenticated user.");

    return {
      message: "File uploaded successfully.",
      userId: String(userId),
      originalFileName: file.originalname,
      storedFileName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      relativePath: `uploads/${userId}/${file.filename}`,
    };
  }
}
