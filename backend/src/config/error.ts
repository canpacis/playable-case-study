import { logger } from "@utils/logger";
import { StatusCodes } from "http-status-codes";
import type { Response } from "express";

export class AppError extends Error {
  constructor(public status: number, public message: string) {
    super(message);
  }
}

export function handleError(error: unknown, res: Response) {
  if (error instanceof AppError) {
    logger.error(String(error), "status", error.status);
    res.status(error.status).json({ message: error.message });
  } else {
    logger.error(String(error), "status", StatusCodes.INTERNAL_SERVER_ERROR);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: String(error) });
  }
}
