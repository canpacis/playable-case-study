import { z } from "zod";
import { AppError } from "@config/error";
import { StatusCodes } from "http-status-codes";
import { formatZodError, type Context, type Paginated } from "@utils/misc";
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

export async function createTodo(
  context: Context<CreateTodoDTO>
): Promise<Document> {
  const validation = createTodoSchema.safeParse({
    ...context.data,
    author: context.request.user.user_id,
  });

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

const paginationSchema = z.object({
  page: z.number().min(1),
  perPage: z.number().min(1),
});

export type PaginationDTO = z.infer<typeof paginationSchema>;

export async function listTodos(
  context: Context<PaginationDTO>
): Promise<Paginated<Document>> {
  const validation = paginationSchema.safeParse(context.data);
  if (!validation.success) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      formatZodError(validation.error)
    );
  }
  const {
    data: { page, perPage },
  } = validation;

  try {
    const total = await Todo.countDocuments();
    const todos = await Todo.find({ author: context.request.user.user_id })
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

export async function getTodo(context: Context<string>): Promise<Document> {
  const id = context.data;
  const todo = await Todo.findById(id).exec();

  // If the author is not the user return 404 as well
  if (!todo || todo.author !== context.request.user.user_id) {
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

type UpdateContext = {
  id: string;
  todo: UpdateTodoDTO;
};

export async function updateTodo(
  context: Context<UpdateContext>
): Promise<Document> {
  const validation = updateTodoSchema.safeParse(context.data.todo);

  if (!validation.success) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      formatZodError(validation.error)
    );
  }
  const { data } = validation;

  const record = await Todo.findById(context.data.id).exec();
  // If the author is not the user return 404 as well
  if (!record || record.author !== context.request.user.user_id) {
    throw new AppError(StatusCodes.NOT_FOUND, "Resource not found");
  }

  try {
    await Todo.findByIdAndUpdate(context.data.id, {
      title: data.title,
      description: data.description,
      priority: data.priority,
    });

    return Object.assign(record, data);
  } catch (error) {
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, String(error));
  }
}

export async function deleteTodo(context: Context<string>): Promise<boolean> {
  const id = context.data;
  const todo = await Todo.findById(id).exec();

  // If the author is not the user return 404 as well
  if (!todo || todo.author !== context.request.user.user_id) {
    throw new AppError(StatusCodes.NOT_FOUND, "Resource not found");
  }

  try {
    await Todo.findByIdAndDelete(id);
    return true;
  } catch (error) {
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, String(error));
  }
}
