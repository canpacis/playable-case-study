import admin, { type ServiceAccount } from "firebase-admin";
import StatusCode from "http-status-codes";
import type { NextFunction, Response, Request } from "express";

admin.initializeApp({
  credential: admin.credential.cert({
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    universe_domain: "googleapis.com",
  } as ServiceAccount),
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
    const decoded = await auth.verifyIdToken(token, true);
    req.user = {
      id: decoded.user_id,
    };
    next();
  } catch (error) {
    res.status(StatusCode.UNAUTHORIZED).json({ error: "unauthorized" });
  }
}
