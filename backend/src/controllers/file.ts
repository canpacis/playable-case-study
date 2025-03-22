import { v4 } from "uuid";
import type { Context } from "@utils/misc";
import { getAppBucket } from "@config/storage";
import { FileUpload, ImageUpload } from "@models/file";
import type { Document } from "mongoose";
import { db, storage } from "@/main";
import sharp from "sharp";
import { AppError } from "../config/error";
import { StatusCodes } from "http-status-codes";

type UploadFileContext = {
  name: string;
  file: Buffer;
  mimetype: string;
};

export async function uploadFile(
  context: Context<UploadFileContext>
): Promise<Document> {
  const id = v4();

  const session = await db.startSession();
  session.startTransaction();

  const document = await new FileUpload({
    location: id,
    original_name: context.data.name,
    owner: context.request.user.user_id,
    created_at: new Date(),
    // normally I should pass the session to include this in the transaction.
    // After this point, any failure such as failing to upload the file will
    // make this record irrelevant so this should be in an uncommitable transaction.
    // Transactions are not supported with a single instance of mongo so I will
    // just acknowledge it here and not implement it.
  }).save();

  await storage.putObject(getAppBucket(), id, context.data.file);

  await session.commitTransaction();
  await session.endSession();
  return document;
}

export async function uploadImage(context: Context<Buffer>): Promise<Document> {
  let thumbnail: Buffer<ArrayBufferLike>;
  let medium: Buffer<ArrayBufferLike>;

  try {
    [thumbnail, medium] = await Promise.all([
      sharp(context.data).resize(200).webp().toBuffer(),
      sharp(context.data).resize(600).webp().toBuffer(),
    ]);
  } catch (error) {
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, String(error));
  }

  const thumbnailId = v4();
  const mediumId = v4();
  const originalId = v4();

  try {
    // these actions should be transactions as well but I don't have time
    await Promise.all([
      storage.putObject(getAppBucket(), thumbnailId, thumbnail),
      storage.putObject(getAppBucket(), mediumId, medium),
      storage.putObject(getAppBucket(), originalId, context.data),
    ]);

    const document = await new ImageUpload({
      thumbnail: thumbnailId,
      medium: mediumId,
      original: originalId,
      owner: context.request.user.user_id,
      created_at: new Date(),
    }).save();

    return document;
  } catch (error) {
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, String(error));
  }
}
