import { Schema, model } from "mongoose";

const schema = new Schema({
  title: String,
  description: String,
  priority: String,
  author: String,
  tags: [{ type: Schema.Types.ObjectId, ref: "Tag" }],
  attachments: [{ type: Schema.Types.ObjectId, ref: "File" }],
  created_at: Date,
});

export const Todo = model("Todo", schema);

const tagSchema = new Schema({
  title: String,
  author: String,
});

export const Tag = model("Tag", tagSchema);
