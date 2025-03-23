import { Schema, model } from "mongoose";

const fileSchema = new Schema({
  location: String,
  originalName: String,
  owner: String,
  createdAt: Date,
});

export const FileUpload = model("File", fileSchema);

export const imageSchemaDef = {
  thumbnail: String,
  medium: String,
  original: String,
  owner: String,
  createdAt: Date,
} as const;

const imageSchema = new Schema(imageSchemaDef);

export const ImageUpload = model("Image", imageSchema);

export type ImageDTO = {
  id: string;
  thumbnail: string;
  medium: string;
  original: string;
  createdAt: Date;
};

export type FileDTO = {
  id: string;
  originalName: string;
  url: string;
  createdAt: Date;
};
