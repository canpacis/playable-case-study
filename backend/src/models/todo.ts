import { Schema, model } from "mongoose";
import type { FileDTO, ImageDTO } from "@models/file";
import type { TodoRecommendation } from "@controllers/ai";

export const schemaDef = {
  title: String,
  description: String,
  priority: String,
  author: String,
  image: { type: Schema.Types.ObjectId, ref: "Image" },
  tags: [{ type: Schema.Types.ObjectId, ref: "Tag" }],
  attachments: [{ type: Schema.Types.ObjectId, ref: "File" }],
  createdAt: Date,
  recommendation: {
    title: String,
    description: String,
    priority: String,
    tags: [{ type: String }],
  },
} as const;
const schema = new Schema(schemaDef);

schema.index({ title: "text", description: "text" });

export const Todo = model("Todo", schema);

export type TodoPriority = "high" | "medium" | "low";

export type TodoDTO = {
  id: string;
  title: string;
  description: string;
  image: ImageDTO | null;
  priority: TodoPriority;
  tags: TagDTO[];
  attachments: FileDTO[];
  recommendation: TodoRecommendation;
  createdAt: Date;
};

const tagSchema = new Schema({
  title: String,
  author: String,
  createdAt: Date,
});

export const Tag = model("Tag", tagSchema);

export type TagDTO = {
  id: string;
  title: string;
  createdAt: Date;
};
