import dotenv from "dotenv";

dotenv.config();

const parseOrigins = (value: string | undefined) =>
  (value ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

export const env = {
  port: Number(process.env.PORT ?? 5001),
  mongoUri: process.env.MONGODB_URI,
  clientOrigins: parseOrigins(process.env.CLIENT_ORIGIN),
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
};
