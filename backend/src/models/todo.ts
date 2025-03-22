import { Schema, model } from "mongoose";

export const schemaDef = {
  title: String,
  description: String,
  priority: String,
  author: String,
  image: { type: Schema.Types.ObjectId, ref: "Image" },
  tags: [{ type: Schema.Types.ObjectId, ref: "Tag" }],
  attachments: [{ type: Schema.Types.ObjectId, ref: "File" }],
  created_at: Date,
} as const;
const schema = new Schema(schemaDef);

export const Todo = model("Todo", schema);

const tagSchema = new Schema({
  title: String,
  author: String,
});

export const Tag = model("Tag", tagSchema);

export type TodoPriority = "high" | "medium" | "low";

export type TodoDTO = {
  id: string;
  title: string;
  description: string;
  image: any | null;
  priority: TodoPriority;
  tags: string[];
  attachments: string[];
  created_at: Date;
};
