import { z } from "zod";
import { ai } from "@/main";
import { AppError } from "@config/error";
import { StatusCodes } from "http-status-codes";
import { formatZodError, type Context } from "@utils/misc";

async function getRecommendation<T>(
  component: "title" | "description" | "priority" | "tags",
  content: unknown
): Promise<T | null> {
  const system = {
    title:
      "You are a reccomendation engine, I will provide a title, a description, one of 'high', 'medium' or 'low' as a priority value along with some tags and you will give me the best possible title recommendation for this todo item. Dot NOT add quotations, do NOT add explanations, provide ONLY the answer. Do NOT return json, return plain text.",
    description:
      "You are a reccomendation engine, I will provide a title, a description, one of 'high', 'medium' or 'low' as a priority value along with some tags and you will give me the best possible description recommendation for this todo item. Dot NOT add quotations, do NOT add explanations, provide ONLY the answer. Description should not be shorter than the original, try to add recommendations. Do NOT return json, return plain text.",
    priority:
      "You are a reccomendation engine, I will provide a title, a description, one of 'high', 'medium' or 'low' as a priority value along with some tags and you will give me the best possible priority recommendation for this todo item. The recommendation must only be one of 'high', 'medium' or 'low'. Dot NOT add quotations, do NOT add explanations, provide ONLY the answer. Do NOT return json, return plain text.",
    tags: "You are a reccomendation engine, I will provide a title, a description, one of 'high', 'medium' or 'low' as a priority value along with some tags and you will give me the best possible tag list recommendation for this todo item. The recommendation must be comma seperated strings. Recommend up to 5 tags. Dot NOT add quotations, do NOT add explanations, provide ONLY the answer. Do NOT return json, return plain text.",
  };

  const completion = await ai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: system[component],
      },
      {
        role: "user",
        content: JSON.stringify(content),
      },
    ],
    temperature: 0.4,
    store: true,
  });

  return completion.choices[0].message.content as T | null;
}

const reccomendContentSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(["high", "medium", "low"]),
  tags: z.array(z.string()),
});

export type TodoRecommendation = z.infer<typeof reccomendContentSchema>;

export async function recommendContent(
  context: Context<TodoRecommendation>
): Promise<TodoRecommendation> {
  const validation = reccomendContentSchema.safeParse(context.data);

  if (!validation.success) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      formatZodError(validation.error)
    );
  }

  const { data } = validation;

  const tags = new Set<string>();

  const tagRecommendations = await getRecommendation<string>("tags", data);
  if (tagRecommendations) {
    tagRecommendations
      .split(",")
      .map((tag) => tag.trim())
      .forEach((tag) => tags.add(tag));
  }

  // Doing 4 API calls might not be the best strategy but in a limited timeframe, it is more reliable
  return {
    title: (await getRecommendation("title", data)) ?? data.title,
    description:
      (await getRecommendation("description", data)) ?? data.description,
    priority: (await getRecommendation("priority", data)) ?? data.priority,
    tags: Array.from(tags),
  };
}
