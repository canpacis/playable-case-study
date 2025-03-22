import { Schema, model } from "mongoose";

const fileSchema = new Schema({
  location: String,
  original_name: String,
  owner: String,
  created_at: Date,
});

export const FileUpload = model("File", fileSchema);

const imageSchema = new Schema({
  thumbnail: String,
  medium: String,
  original: String,
  owner: String,
  created_at: Date,
});

export const ImageUpload = model("Image", imageSchema);
