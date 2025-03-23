import type { Application, Request, Response } from "express";
import { createTag, deleteTag, listTags } from "@controllers/tag";
import { handleError } from "@config/error";
import { createContext } from "@utils/misc";
import { authMiddleware } from "../middleware/auth";

export function initTagRoutes(app: Application) {
  app.post("/tags", authMiddleware, async (req: Request, res: Response) => {
    try {
      const todo = await createTag(createContext(req, req.body));
      res.json(todo);
      return;
    } catch (error) {
      return handleError(error, res);
    }
  });

  app.get("/tags", authMiddleware, async (req: Request, res: Response) => {
    try {
      const todo = await listTags(createContext(req, undefined));
      res.json(todo);
      return;
    } catch (error) {
      return handleError(error, res);
    }
  });

  app.delete(
    "/tags/:id",
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const done = await deleteTag(createContext(req, req.params.id));
        res.json({ done });
        return;
      } catch (error) {
        return handleError(error, res);
      }
    }
  );
}
