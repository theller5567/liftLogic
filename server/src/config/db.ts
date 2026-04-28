import mongoose from "mongoose";

import { env } from "./env";

export async function connectToDatabase() {
  if (!env.mongoUri) {
    console.warn("MONGODB_URI is not set. API will run without MongoDB.");
    return;
  }

  await mongoose.connect(env.mongoUri);
  console.log("Connected to MongoDB");
}
