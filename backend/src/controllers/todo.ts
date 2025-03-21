import { z } from "zod";
import { AppError } from "@config/error";
import { StatusCodes } from "http-status-codes";
import { formatZodError, type Paginated } from "@utils/misc";
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

export async function listTodos(
  user: string,
  page = 1,
  perPage = 10
): Promise<Paginated<Document>> {
  try {
    const total = await Todo.countDocuments();
    const todos = await Todo.find({ author: user })
      .limit(perPage)
      .skip((page - 1) * perPage)
      .exec();

    return {
      items: todos,
      total: total,
      hasNext: page * perPage < total,
      hasPrevious: page > 1,
    };
  } catch (error) {
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, String(error));
  }
}

export async function getTodo(id: string, user: string): Promise<Document> {
  const todo = await Todo.findById(id).exec();

  // If the author is not the user return 404 as well
  if (!todo || todo.author !== user) {
    throw new AppError(StatusCodes.NOT_FOUND, "Resource not found");
  }

  return todo;
}

const updateTodoSchema = z.object({
  title: z.string().min(2).max(40).optional(),
  description: z.string().optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
});

export type UpdateTodoDTO = z.infer<typeof updateTodoSchema>;

export async function updateTodo(
  id: string,
  todo: UpdateTodoDTO,
  user: string
): Promise<Document> {
  const validation = updateTodoSchema.safeParse(todo);

  if (!validation.success) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      formatZodError(validation.error)
    );
  }
  const { data } = validation;

  const record = await Todo.findById(id).exec();
  // If the author is not the user return 404 as well
  if (!record || record.author !== user) {
    throw new AppError(StatusCodes.NOT_FOUND, "Resource not found");
  }

  try {
    await Todo.findByIdAndUpdate(id, {
      title: data.title,
      description: data.description,
      priority: data.priority,
    });

    return Object.assign(record, data);
  } catch (error) {
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, String(error));
  }
}

export async function deleteTodo(id: string, user: string): Promise<boolean> {
  const todo = await Todo.findById(id).exec();

  // If the author is not the user return 404 as well
  if (!todo || todo.author !== user) {
    throw new AppError(StatusCodes.NOT_FOUND, "Resource not found");
  }

  try {
    await Todo.findByIdAndDelete(id);
    return true;
  } catch (error) {
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, String(error));
  }
}
