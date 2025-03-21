import admin, { type ServiceAccount } from "firebase-admin";
import StatusCode from "http-status-codes";
import type { NextFunction, Response, Request } from "express";
import serviceAccount from "@utils/service_account.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
});

const auth = admin.auth();

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header) {
    res.status(StatusCode.UNAUTHORIZED).json({ error: "unauthorized" });
    return;
  }
  const token = header.split("Bearer ")[1];
  if (!token || token.trim().length === 0) {
    res.status(StatusCode.UNAUTHORIZED).json({ error: "unauthorized" });
    return;
  }

  try {
    req.user = { user_id: "49Rb3u6rb8SX94P2w7pyDTPRqz52" };
    // req.user = await auth.verifyIdToken(token, true);
    next();
  } catch (error) {
    res.status(StatusCode.UNAUTHORIZED).json({ error: "unauthorized" });
  }
}
