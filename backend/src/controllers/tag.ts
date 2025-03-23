import { z } from "zod";
import { formatZodError, type Context } from "@utils/misc";
import { AppError } from "@config/error";
import { StatusCodes } from "http-status-codes";
import { Tag, type TagDTO } from "@models/todo";
import type { Document } from "mongoose";

function getTagFromDoc(doc: Document): TagDTO {
  const document = doc as unknown as any;
  return {
    id: document._id.toString(),
    title: document.title!,
    createdAt: document.createdAt!,
  };
}

const createTagSchema = z.object({
  title: z.string().min(1),
  author: z.string().length(28),
});

export type CreateTagDTO = z.infer<typeof createTagSchema>;

export async function createTag(
  context: Context<CreateTagDTO>
): Promise<TagDTO> {
  const validation = createTagSchema.safeParse({
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

  const existing = await Tag.find({ title: data.title, author: data.author });
  if (existing.length > 0) {
    return getTagFromDoc(existing[0]);
  }

  const document = new Tag({
    title: data.title,
    author: data.author,
    createdAt: new Date(),
  });
  await document.save();

  return getTagFromDoc(document);
}

export async function listTags(context: Context<void>): Promise<TagDTO[]> {
  const docs = await Tag.find({ author: context.request.user.id });
  return docs.map(getTagFromDoc);
}

export async function deleteTag(context: Context<string>): Promise<boolean> {
  const id = context.data;
  const tag = await Tag.findById(id).exec();

  // If the author is not the user return 404 as well
  if (!tag || tag.author !== context.request.user.id) {
    throw new AppError(StatusCodes.NOT_FOUND, "Resource not found");
  }

  try {
    await Tag.findByIdAndDelete(id);
    return true;
  } catch (error) {
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, String(error));
  }
}
