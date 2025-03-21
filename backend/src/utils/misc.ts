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
