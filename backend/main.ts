import "dotenv/config";
import express, { type Request, type Response } from "express";
import { checkEnv } from "@utils/misc";
import { logger } from "@utils/logger";
import { initDB } from "@config/db";

const app = express();
const port = 5000;

try {
  checkEnv();
  await initDB();
} catch (error) {
  logger.error(error);
  process.exit(1);
}

app.get("/", (req: Request, res: Response) => {
  res.send("Hi there! " + process.env.MONGO_URL);
});

app.listen(port, () => console.log(`App is running on port ${port}`));
