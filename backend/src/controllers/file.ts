import { v4 } from "uuid";
import { type Context } from "@utils/misc";
import { getAppBucket } from "@config/storage";
import {
  FileUpload,
  ImageUpload,
  type FileDTO,
  type ImageDTO,
} from "@models/file";
import { Readable } from "stream";
import { db, storage } from "@/main";
import sharp from "sharp";
import { AppError } from "@config/error";
import { StatusCodes } from "http-status-codes";

export async function getFileFromDoc(document: any): Promise<FileDTO> {
  return {
    id: String(document._id),
    originalName: document.originalName,
    url: `${process.env.APP_URL}/asset/${document.location}`,
    createdAt: new Date(document.createdAt!),
  };
}

type UploadFileContext = {
  name: string;
  file: Buffer;
  mimetype: string;
};

export async function uploadFile(
  context: Context<UploadFileContext>
): Promise<FileDTO> {
  const id = v4();

  const session = await db.startSession();
  session.startTransaction();

  const document = await new FileUpload({
    location: id,
    originalName: context.data.name,
    owner: context.request.user.id,
    createdAt: new Date(),
    // normally I should pass the session to include this in the transaction.
    // After this point, any failure such as failing to upload the file will
    // make this record irrelevant so this should be in an uncommitable transaction.
    // Transactions are not supported with a single instance of mongo so I will
    // just acknowledge it here and not implement it.
  }).save();

  await storage.putObject(getAppBucket(), id, context.data.file, undefined, {
    mimetype: context.data.mimetype,
  });

  await session.commitTransaction();
  await session.endSession();
  return getFileFromDoc(document);
}

export async function getImageFromDoc(document: any): Promise<ImageDTO> {
  return {
    id: String(document._id),
    thumbnail: `${process.env.APP_URL}/asset/${document.thumbnail}`,
    medium: `${process.env.APP_URL}/asset/${document.medium}`,
    original: `${process.env.APP_URL}/asset/${document.original}`,
    createdAt: new Date(document.createdAt!),
  };
}

export async function uploadImage(context: Context<Buffer>): Promise<ImageDTO> {
  let thumbnail: Buffer<ArrayBufferLike>;
  let medium: Buffer<ArrayBufferLike>;
  let original: Buffer<ArrayBufferLike>;

  try {
    [thumbnail, medium, original] = await Promise.all([
      sharp(context.data).resize(200).webp().toBuffer(),
      sharp(context.data).resize(600).webp().toBuffer(),
      sharp(context.data).webp().toBuffer(),
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
      storage.putObject(getAppBucket(), thumbnailId, thumbnail, undefined, {
        mimetype: "image/webp",
      }),
      storage.putObject(getAppBucket(), mediumId, medium, undefined, {
        mimetype: "image/webp",
      }),
      storage.putObject(getAppBucket(), originalId, original, undefined, {
        mimetype: "image/webp",
      }),
    ]);

    const document = await new ImageUpload({
      thumbnail: thumbnailId,
      medium: mediumId,
      original: originalId,
      owner: context.request.user.id,
      createdAt: new Date(),
    }).save();

    return await getImageFromDoc(document);
  } catch (error) {
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, String(error));
  }
}

export async function downloadAsset(
  context: Context<string>
): Promise<Readable> {
  const readable = await storage.getObject(getAppBucket(), context.data);
  return readable;
}
