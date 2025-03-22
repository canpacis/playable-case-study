import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  location: String,
  original_name: String,
  owner: String,
  created_at: Date,
});

export const FileUpload = mongoose.model("File", fileSchema);

const imageSchema = new mongoose.Schema({
  thumbnail: String,
  medium: String,
  original: String,
  owner: String,
  created_at: Date,
});

export const ImageUpload = mongoose.model("Image", imageSchema);
