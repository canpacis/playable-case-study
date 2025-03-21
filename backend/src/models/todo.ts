import mongoose from "mongoose";

const schema = new mongoose.Schema({
  title: String,
  description: String,
  priority: String,
  author: String,
});

export const Todo = mongoose.model("Todo", schema);
