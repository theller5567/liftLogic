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
};
