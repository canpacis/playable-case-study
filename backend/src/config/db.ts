import mongoose from "mongoose";

export async function initDB(): Promise<typeof mongoose> {
  return await mongoose.connect(process.env.MONGO_URL!);
}
