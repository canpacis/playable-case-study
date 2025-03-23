import type { Application, Request, Response } from "express";
import { recommendContent } from "@controllers/ai";
import { createContext } from "@utils/misc";
import { handleError } from "@config/error";
import { authMiddleware } from "../middleware/auth";

export function initAiRoutes(app: Application) {
  app.post(
    "/recommend",
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        console.log(req.body);
        const recommendation = await recommendContent(
          createContext(req, req.body)
        );
        res.json(recommendation);
        return;
      } catch (error) {
        return handleError(error, res);
      }
    }
  );
}
