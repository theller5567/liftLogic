import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

import { env } from "./env";

type FirebaseCredentialConfig = {
  clientEmail: string;
  privateKey: string;
  projectId: string;
};

const parseServiceAccountJson = (): FirebaseCredentialConfig | null => {
  if (!env.firebaseServiceAccountJson) {
    return null;
  }

  try {
    const serviceAccount = JSON.parse(env.firebaseServiceAccountJson) as {
      client_email?: string;
      private_key?: string;
      project_id?: string;
    };

    if (
      !serviceAccount.client_email ||
      !serviceAccount.private_key ||
      !serviceAccount.project_id
    ) {
      return null;
    }

    return {
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key.replace(/\\n/g, "\n"),
      projectId: serviceAccount.project_id,
    };
  } catch {
    return null;
  }
};

const firebaseCredentials =
  env.firebaseProjectId && env.firebaseClientEmail && env.firebasePrivateKey
    ? {
        clientEmail: env.firebaseClientEmail,
        privateKey: env.firebasePrivateKey,
        projectId: env.firebaseProjectId,
      }
    : parseServiceAccountJson();

if (firebaseCredentials && getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: firebaseCredentials.projectId,
      clientEmail: firebaseCredentials.clientEmail,
      privateKey: firebaseCredentials.privateKey,
    }),
  });
}

export const isFirebaseAdminConfigured = () => Boolean(firebaseCredentials);

export const firebaseAuth = () => {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase Admin is not configured.");
  }

  return getAuth();
};
