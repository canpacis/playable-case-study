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
import { createContext } from "@utils/misc";

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
      const todo = await createTodo(createContext(req, req.body));
      res.json(todo);
      return;
    } catch (error) {
      return handleError(error, res);
    }
  });

  app.get("/todos", authMiddleware, async (req: Request, res: Response) => {
    try {
      const todo = await listTodos(
        createContext(req, {
          page: Number(req.query.page),
          perPage: Number(req.query.perPage),
        })
      );
      res.json(todo);
      return;
    } catch (error) {
      return handleError(error, res);
    }
  });

  app.get("/todos/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const todo = await getTodo(createContext(req, req.params.id));
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
          createContext(req, { todo: req.body, id: req.params.id })
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
        const done = await deleteTodo(createContext(req, req.params.id));
        res.json({ done });
        return;
      } catch (error) {
        return handleError(error, res);
      }
    }
  );
}
