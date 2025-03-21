import type { Application, Request, Response } from "express";
import { authMiddleware } from "@middleware/auth";
import {
  createTodo,
  deleteTodo,
  getTodo,
  listTodos,
  updateTodo,
} from "@controllers/todo";
import { AppError } from "@config/error";
import { StatusCodes } from "http-status-codes";
import { logger } from "@utils/logger";

function handleError(error: unknown, res: Response) {
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

export function initTodoRoutes(app: Application) {
  app.post("/todos", authMiddleware, async (req: Request, res: Response) => {
    try {
      const todo = await createTodo({ ...req.body, author: req.user.user_id });
      res.json(todo);
      return;
    } catch (error) {
      return handleError(error, res);
    }
  });

  app.get("/todos", authMiddleware, async (req: Request, res: Response) => {
    try {
      const todo = await listTodos(
        req.user.user_id,
        Number(req.query.page),
        Number(req.query.perPage)
      );
      res.json(todo);
      return;
    } catch (error) {
      return handleError(error, res);
    }
  });

  app.get("/todos/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const todo = await getTodo(req.params.id, req.user.user_id);
      res.json(todo);
      return;
    } catch (error) {
      return handleError(error, res);
    }
  });

  app.patch(
    "/todos/:id",
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const todo = await updateTodo(
          req.params.id as string,
          { ...req.body },
          req.user.user_id
        );
        res.json(todo);
        return;
      } catch (error) {
        return handleError(error, res);
      }
    }
  );

  app.delete(
    "/todos/:id",
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const done = await deleteTodo(req.params.id, req.user.user_id);
        res.json({ done });
        return;
      } catch (error) {
        return handleError(error, res);
      }
    }
  );
}
