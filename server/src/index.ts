import app from "./app";
import { connectToDatabase } from "./config/db";
import { env } from "./config/env";

async function startServer() {
  await connectToDatabase();

  app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
  });
}

void startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
