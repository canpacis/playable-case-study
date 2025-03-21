import express, { type Request, type Response } from "express";

const app = express();
const port = 5000;

app.get("/", (req: Request, res: Response) => {
  res.send("Hi there!");
});

app.listen(port, () => console.log(`App is running on port ${port}`));
