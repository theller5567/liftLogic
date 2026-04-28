import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

import { env } from "./env";

const hasFirebaseCredentials =
  env.firebaseProjectId && env.firebaseClientEmail && env.firebasePrivateKey;

if (hasFirebaseCredentials && getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: env.firebaseProjectId,
      clientEmail: env.firebaseClientEmail,
      privateKey: env.firebasePrivateKey,
    }),
  });
}

export const isFirebaseAdminConfigured = () => Boolean(hasFirebaseCredentials);

export const firebaseAuth = () => {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase Admin is not configured.");
  }

  return getAuth();
};
