import { z } from "zod";
import { AppError } from "@config/error";
import { StatusCodes } from "http-status-codes";
import { formatZodError, type Context, type Paginated } from "@utils/misc";
import { Tag, Todo, type TodoDTO, type TodoPriority } from "@models/todo";
import { FileUpload, ImageUpload } from "@models/file";
import type { Document } from "mongoose";
import { getFileFromDoc, getImageFromDoc } from "@controllers/file";
import { getTagFromDoc } from "@controllers/tag";

export async function getTodoFromDoc(document: any): Promise<TodoDTO> {
  let image = null;
  if (document.image) {
    const doc = await ImageUpload.findById(document.image);
    image = await getImageFromDoc(doc);
  }

  let attachments = [];
  for await (const id of document.attachments!) {
    const doc = await FileUpload.findById(id.toString());
    attachments.push(await getFileFromDoc(doc));
  }

  let tags = [];
  for await (const id of document.tags!) {
    const doc = (await Tag.findById(id.toString())) as Document;
    tags.push(getTagFromDoc(doc));
  }

  return {
    id: document._id.toString(),
    title: document.title!,
    description: document.description!,
    image: image,
    priority: document.priority as TodoPriority,
    tags: tags,
    attachments: attachments,
    recommendation: document.recommendation,
    createdAt: new Date(document.createdAt!),
  };
}

const createTodoSchema = z.object({
  title: z.string().min(1).max(40),
  description: z.string(),
  // a user id in firebase is a string in length 28.
  // this might cause problem if the app moves away from firebase (?)
  author: z.string().length(28),
  priority: z.enum(["high", "medium", "low"]),
  // length of a mongo object id
  image: z.string().length(24).optional(),
  tags: z.array(z.string().length(24)),
  attachments: z.array(z.string().length(24)),
  recommendation: z.object({
    title: z.string().min(1).max(40),
    description: z.string(),
    priority: z.enum(["high", "medium", "low"]),
    // these are raw strings not ids
    tags: z.array(z.string()),
  }),
});

export type CreateTodoDTO = z.infer<typeof createTodoSchema>;

export async function createTodo(
  context: Context<CreateTodoDTO>
): Promise<TodoDTO> {
  const validation = createTodoSchema.safeParse({
    ...context.data,
    author: context.request.user.id,
  });

  if (!validation.success) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      formatZodError(validation.error)
    );
  }
  const { data } = validation;

  const tagCount = await Tag.countDocuments({ _id: { $in: data.tags } });
  if (tagCount !== data.tags.length) {
    throw new AppError(StatusCodes.BAD_REQUEST, "invalid tag relation");
  }

  const attachmentCount = await FileUpload.countDocuments({
    _id: { $in: data.attachments },
  });
  if (attachmentCount !== data.attachments.length) {
    throw new AppError(StatusCodes.BAD_REQUEST, "invalid attachment relation");
  }

  if (data.image) {
    const image = await ImageUpload.findById(data.image);
    if (!image) {
      throw new AppError(StatusCodes.BAD_REQUEST, "invalid image relation");
    }
  }

  try {
    const doc = new Todo({ ...data, createdAt: new Date() });
    await doc.save();
    return getTodoFromDoc(doc);
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
): Promise<Paginated<TodoDTO>> {
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
    const todos = await Todo.find({ author: context.request.user.id })
      .limit(perPage)
      .skip((page - 1) * perPage)
      .exec();

    return {
      items: await Promise.all(todos.map((todo) => getTodoFromDoc(todo))),
      total: total,
      hasNext: page * perPage < total,
      hasPrevious: page > 1,
    };
  } catch (error) {
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, String(error));
  }
}

export async function getTodo(context: Context<string>): Promise<TodoDTO> {
  const id = context.data;
  const todo = await Todo.findById(id).exec();

  // If the author is not the user return 404 as well
  if (!todo || todo.author !== context.request.user.id) {
    throw new AppError(StatusCodes.NOT_FOUND, "Resource not found");
  }

  return await getTodoFromDoc(todo);
}

const updateTodoSchema = z.object({
  title: z.string().min(2).max(40).optional(),
  description: z.string().optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  image: z.string().length(24).optional(),
  tags: z.array(z.string().length(24)),
  attachments: z.array(z.string().length(24)),
  recommendation: z.object({
    title: z.string().min(1).max(40),
    description: z.string(),
    priority: z.enum(["high", "medium", "low"]),
    // these are raw strings not ids
    tags: z.array(z.string()),
  }),
});

export type UpdateTodoDTO = z.infer<typeof updateTodoSchema>;

type UpdateContext = {
  id: string;
  todo: UpdateTodoDTO;
};

export async function updateTodo(
  context: Context<UpdateContext>
): Promise<TodoDTO> {
  const validation = updateTodoSchema.safeParse(context.data.todo);

  if (!validation.success) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      formatZodError(validation.error)
    );
  }
  const { data } = validation;

  const doc = await Todo.findById(context.data.id).exec();
  // If the author is not the user return 404 as well
  if (!doc || doc.author !== context.request.user.id) {
    throw new AppError(StatusCodes.NOT_FOUND, "Resource not found");
  }

  const tagCount = await Tag.countDocuments({ _id: { $in: data.tags } });
  if (tagCount !== data.tags.length) {
    throw new AppError(StatusCodes.BAD_REQUEST, "invalid tag relation");
  }

  const attachmentCount = await FileUpload.countDocuments({
    _id: { $in: data.attachments },
  });
  if (attachmentCount !== data.attachments.length) {
    throw new AppError(StatusCodes.BAD_REQUEST, "invalid attachment relation");
  }

  if (data.image) {
    const image = await ImageUpload.findById(data.image);
    if (!image) {
      throw new AppError(StatusCodes.BAD_REQUEST, "invalid image relation");
    }
  }

  try {
    const document = await Todo.findByIdAndUpdate(context.data.id, {
      title: data.title,
      description: data.description,
      priority: data.priority,
      image: data.image,
      tags: data.tags,
      attachments: data.attachments,
      recommendation: data.recommendation,
    });

    return await getTodoFromDoc(document);
  } catch (error) {
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, String(error));
  }
}

export async function deleteTodo(context: Context<string>): Promise<boolean> {
  const id = context.data;
  const todo = await Todo.findById(id).exec();

  // If the author is not the user return 404 as well
  if (!todo || todo.author !== context.request.user.id) {
    throw new AppError(StatusCodes.NOT_FOUND, "Resource not found");
  }

  try {
    await Todo.findByIdAndDelete(id);
    return true;
  } catch (error) {
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, String(error));
  }
}

export async function searchTodos(
  context: Context<string>
): Promise<TodoDTO[]> {
  const docs = await Todo.find({
    author: context.request.user.id,
    $text: { $search: context.data },
  }).exec();

  return await Promise.all(docs.map(getTodoFromDoc));
}

export async function filterTodos(
  context: Context<string[]>
): Promise<TodoDTO[]> {
  const docs = await Todo.find({
    author: context.request.user.id,
    tags: { $in: context.data },
  }).exec();

  return await Promise.all(docs.map(getTodoFromDoc));
}
