import { z } from "zod";
import { AppError } from "@config/error";
import { StatusCodes } from "http-status-codes";
import { formatZodError } from "@utils/misc";
import { Todo } from "@models/todo";
import type { Document } from "mongoose";

export type TodoPriority = "high" | "medium" | "low";

const createTodoSchema = z.object({
  title: z.string().min(2).max(40),
  description: z.string(),
  // a user id in firebase is a string in length 28.
  // this might cause problem if the app moves away from firebase (?)
  author: z.string().length(28),
  priority: z.enum(["high", "medium", "low"]),
});

export type CreateTodoDTO = z.infer<typeof createTodoSchema>;

export async function createTodo(todo: CreateTodoDTO): Promise<Document> {
  const validation = createTodoSchema.safeParse(todo);

  if (!validation.success) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      formatZodError(validation.error)
    );
  }
  const { data } = validation;

  try {
    const doc = new Todo(data);
    await doc.save();
    return doc;
  } catch (error) {
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, String(error));
  }
}
