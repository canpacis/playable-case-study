import { z } from "zod";

export function checkEnv() {
  const envSchema = z.object({
    MONGO_URL: z.string(),
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
