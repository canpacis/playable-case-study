import "dotenv/config";
import express, { type Request, type Response } from "express";
import { checkEnv } from "@utils/misc";
import { logger } from "@utils/logger";
import { initDB } from "@config/db";
import { initTodoRoutes } from "./src/routes/todo";
import cors from "cors";

const app = express();
const port = 5000;

try {
  checkEnv();
  await initDB();
} catch (error) {
  logger.error(error);
  process.exit(1);
}

app.use(express.json());
app.use(cors());

initTodoRoutes(app);

app.listen(port, () => console.log(`App is running on port ${port}`));
