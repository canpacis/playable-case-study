import multer from "multer";
import type { Application, Request, Response } from "express";
import { authMiddleware } from "@middleware/auth";
import { AppError, handleError } from "@config/error";
import { downloadAsset, uploadFile, uploadImage } from "@controllers/file";
import { createContext } from "@utils/misc";
import { StatusCodes } from "http-status-codes";
import path from "path";

const storage = multer.memoryStorage();

const imageUpload = multer({
  storage,
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (ext !== ".png" && ext !== ".jpg" && ext !== ".gif" && ext !== ".jpeg") {
      return callback(null, false);
    }
    callback(null, true);
  },
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
});

const fileUpload = multer({ storage });

export function initFileRoutes(app: Application) {
  app.post(
    "/upload/file",
    authMiddleware,
    fileUpload.single("file"),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          throw new AppError(
            StatusCodes.BAD_REQUEST,
            "a valid image file in the file field is expected"
          );
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
    authMiddleware,
    imageUpload.single("file"),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          throw new AppError(StatusCodes.BAD_REQUEST, "a valid image file in the file field is expected");
        }

        const file = await uploadImage(createContext(req, req.file.buffer));
        res.json(file);
        return;
      } catch (error) {
        return handleError(error, res);
      }
    }
  );

  app.get("/asset/:id", async (req: Request, res: Response) => {
    try {
      const stream = await downloadAsset(createContext(req, req.params.id));

      stream.pipe(res);
      return;
    } catch (error) {
      return handleError(error, res);
    }
  });
}
