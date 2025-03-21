import admin, { type ServiceAccount } from "firebase-admin";
import StatusCode from "http-status-codes";
import type { NextFunction, Response, Request, RequestHandler } from "express";
import serviceAccount from "@utils/service_account.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
});

const auth = admin.auth();

export const authMiddleware = async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(StatusCode.UNAUTHORIZED).json({ error: "unauthorized" });
  }
  const token = header.split("Bearer ")[1];
  if (!token || token.trim().length === 0) {
    return res.status(StatusCode.UNAUTHORIZED).json({ error: "unauthorized" });
  }

  try {
    req.user = await auth.verifyIdToken(token, true);
    return next();
  } catch (error) {
    return res.status(StatusCode.UNAUTHORIZED).json({ error: "unauthorized" });
  }
} as RequestHandler;
