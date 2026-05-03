import cors from "cors";
import express, {
  type ErrorRequestHandler,
  type Request,
  type Response,
} from "express";
import helmet from "helmet";
import { ZodError } from "zod";

import { env } from "./config/env";
import profileRoutes from "./routes/profileRoutes";
import workoutPlanRoutes from "./routes/workoutPlanRoutes";
import workoutSessionRoutes from "./routes/workoutSessionRoutes";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.clientOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ message: "LiftLogic API is running" });
});

app.use("/api/profile", profileRoutes);
app.use("/api/workout-plan", workoutPlanRoutes);
app.use("/api/workout-sessions", workoutSessionRoutes);

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      code: "VALIDATION_ERROR",
      error: "Invalid request body.",
      details: error.flatten(),
    });
    return;
  }

  console.error(error);
  res.status(500).json({
    code: "INTERNAL_SERVER_ERROR",
    error: "Internal server error.",
  });
};

app.use(errorHandler);

export default app;
