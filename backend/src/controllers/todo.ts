import { z } from "zod";
import { AppError } from "@config/error";
import { StatusCodes } from "http-status-codes";
import {
  copyContext,
  formatZodError,
  type Context,
  type Paginated,
} from "@utils/misc";
import {
  schemaDef,
  Tag,
  Todo,
  type TodoDTO,
  type TodoPriority,
} from "@models/todo";
import { FileUpload, ImageUpload } from "@models/file";
import type { Document, InferRawDocType, ObjectId } from "mongoose";
import { getFileFromDoc, getImageFromDoc } from "@controllers/file";
import { getTagFromDoc } from "@controllers/tag";

export async function getTodoFromDoc(
  context: Context<InferRawDocType<typeof schemaDef> & { _id: ObjectId }>
): Promise<TodoDTO> {
  let image = null;
  if (context.data.image) {
    const doc = await ImageUpload.findById(context.data.image);
    image = await getImageFromDoc(copyContext(context, doc as unknown as any));
  }

  let attachments = [];
  for await (const id of context.data.attachments!) {
    const doc = await FileUpload.findById(id.toString());
    attachments.push(await getFileFromDoc(copyContext(context, doc)));
  }

  let tags = [];
  for await (const id of context.data.tags!) {
    const doc = (await Tag.findById(id.toString())) as Document;
    tags.push(getTagFromDoc(doc));
  }

  const doc = context.data;

  return {
    id: doc._id.toString(),
    title: doc.title!,
    description: doc.description!,
    image: image,
    priority: doc.priority as TodoPriority,
    tags: tags,
    attachments: attachments,
    createdAt: new Date(doc.createdAt!),
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
    return getTodoFromDoc(copyContext(context, doc as unknown as any));
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
      items: await Promise.all(
        todos.map((todo) =>
          getTodoFromDoc(copyContext(context, todo as unknown as any))
        )
      ),
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

  return await getTodoFromDoc(copyContext(context, todo as unknown as any));
}

const updateTodoSchema = z.object({
  title: z.string().min(2).max(40).optional(),
  description: z.string().optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  image: z.string().length(24).optional(),
  tags: z.array(z.string().length(24)),
  attachments: z.array(z.string().length(24)),
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
    });

    return await getTodoFromDoc(
      copyContext(context, document as unknown as any)
    );
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
