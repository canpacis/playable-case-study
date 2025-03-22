import { z } from "zod";
import type { Request, Response } from "express";
import { Readable } from "stream";

export function checkEnv() {
  const envSchema = z.object({
    MONGO_URL: z.string(),
    MINIO_ROOT_USER: z.string(),
    MINIO_ROOT_PASSWORD: z.string(),
    MINIO_DEFAULT_BUCKETS: z.string(),
  });

  try {
    envSchema.parse(process.env);
  } catch (error) {
    throw new Error(
      JSON.stringify({ message: "Failed to verify environment", error })
    );
  }
}

export function formatZodError<T>(error: z.ZodError<T>): string {
  const result: string[] = [];
  for (const entry of Object.entries(error.flatten().fieldErrors)) {
    const [key, message] = entry as [string, string];
    if (message.length > 0) {
      result.push(`${key} ${message}`);
    }
  }
  return result.join(", ");
}

export type Paginated<T> = {
  items: T[];
  total: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type Context<T> = {
  request: Request;
  data: T;
};

export function createContext<T>(
  req: Request,
  data: T
): Context<T> {
  return { request: req, data: data };
}

export function copyContext<T>(context: Context<unknown>, data: T): Context<T> {
  return { request: context.request, data: data };
}

export function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve) => {
    const buff: number[] = [];

    stream.on("data", async (chunk) => {
      buff.push(chunk);
    });

    stream.on("end", function () {
      resolve(Buffer.from(buff));
    });
  });
}
