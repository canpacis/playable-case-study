import { Schema, model } from "mongoose";

const fileSchema = new Schema({
  location: String,
  original_name: String,
  owner: String,
  created_at: Date,
});

export const FileUpload = model("File", fileSchema);

export const imageSchemaDef = {
  thumbnail: String,
  medium: String,
  original: String,
  owner: String,
  created_at: Date,
} as const;

const imageSchema = new Schema(imageSchemaDef);

export const ImageUpload = model("Image", imageSchema);

export type ImageRecord = {
  thumbnail: string;
  medium: string;
  original: string;
  created_at: Date;
};
