import "dotenv/config";
import "@config/storage";
import * as Minio from "minio";
import cors from "cors";
import express from "express";
import type mongoose from "mongoose";
import type OpenAI from "openai";
import { logger } from "@utils/logger";
import { initDB } from "@config/db";
import { initStorage } from "@config/storage";
import { initAiClient } from "@config/ai";
import { checkEnv } from "@utils/misc";
import { initAiRoutes } from "@routes/ai";
import { initTagRoutes } from "@routes/tag";
import { initTodoRoutes } from "@routes/todo";
import { initFileRoutes } from "@routes/file";

const app = express();
const port = 5000;

export let db: typeof mongoose;
export let storage: Minio.Client;
export let ai: OpenAI;

try {
  checkEnv();
  storage = initStorage();
  db = await initDB();
  ai = initAiClient();
} catch (error) {
  logger.error(error);
  process.exit(1);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

initTodoRoutes(app);
initFileRoutes(app);
initTagRoutes(app);
initAiRoutes(app);

app.listen(port, () => console.log(`App is running on port ${port}`));
