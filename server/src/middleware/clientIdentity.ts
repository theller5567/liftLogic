import type { NextFunction, Request, Response } from "express";

import { firebaseAuth, isFirebaseAdminConfigured } from "../config/firebaseAdmin";

export type ClientIdentityRequest = Request & {
  clientId: string;
  authProvider: "anonymous" | "firebase";
  authUserId?: string;
  authEmail?: string;
  authEmailVerified?: boolean;
  authDisplayName?: string;
  authPhotoUrl?: string;
};

const getBearerToken = (req: Request) => {
  const authorizationHeader = req.header("authorization");

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.slice("Bearer ".length).trim();
};

export async function requireClientIdentity(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const bearerToken = getBearerToken(req);

  if (bearerToken) {
    if (!isFirebaseAdminConfigured()) {
      res.status(500).json({
        code: "FIREBASE_ADMIN_NOT_CONFIGURED",
        error: "Firebase Admin is not configured.",
      });
      return;
    }

    try {
      const decodedToken = await firebaseAuth().verifyIdToken(bearerToken);
      const identityRequest = req as ClientIdentityRequest;
      identityRequest.clientId = decodedToken.uid;
      identityRequest.authProvider = "firebase";
      identityRequest.authUserId = decodedToken.uid;
      identityRequest.authEmail = decodedToken.email;
      identityRequest.authEmailVerified = decodedToken.email_verified;
      identityRequest.authDisplayName = decodedToken.name;
      identityRequest.authPhotoUrl = decodedToken.picture;
      next();
      return;
    } catch {
      res.status(401).json({
        code: "INVALID_FIREBASE_TOKEN",
        error: "Invalid Firebase ID token.",
      });
      return;
    }
  }

  const clientIdHeader = req.header("x-liftlogic-client-id");
  const clientId = Array.isArray(clientIdHeader)
    ? clientIdHeader[0]
    : clientIdHeader;

  if (!clientId) {
    res.status(400).json({
      code: "MISSING_CLIENT_ID",
      error: "Missing Authorization bearer token or x-liftlogic-client-id header.",
    });
    return;
  }

  const identityRequest = req as ClientIdentityRequest;
  identityRequest.clientId = clientId;
  identityRequest.authProvider = "anonymous";
  next();
}
