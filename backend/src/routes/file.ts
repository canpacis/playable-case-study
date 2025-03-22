import multer from "multer";
import type { Application, Request, Response } from "express";
import { authMiddleware } from "@middleware/auth";
import { AppError, handleError } from "@config/error";
import { uploadFile, uploadImage } from "@controllers/file";
import { createContext } from "@utils/misc";
import { StatusCodes } from "http-status-codes";

const storage = multer.memoryStorage();
const upload = multer({ storage });

export function initFileRoutes(app: Application) {
  app.post(
    "/upload/file",
    upload.single("file"),
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          throw new AppError(StatusCodes.BAD_REQUEST, "no file");
        }

        const file = await uploadFile(
          createContext(req, {
            name: req.file.originalname,
            file: req.file.buffer,
            mimetype: req.file.mimetype,
          })
        );
        res.json(file);
        return;
      } catch (error) {
        return handleError(error, res);
      }
    }
  );

  app.post(
    "/upload/image",
    upload.single("file"),
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          throw new AppError(StatusCodes.BAD_REQUEST, "no file");
        }

        const file = await uploadImage(createContext(req, req.file.buffer));
        res.json(file);
        return;
      } catch (error) {
        return handleError(error, res);
      }
    }
  );
}
