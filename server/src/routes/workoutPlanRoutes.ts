import { Router } from "express";
import { z } from "zod";

import { WorkoutPlan } from "../models/WorkoutPlan";
import {
  requireClientIdentity,
  type ClientIdentityRequest,
} from "../middleware/clientIdentity";

const workoutPreviewSchema = z.object({}).passthrough();

const router = Router();

router.use(requireClientIdentity);

router.get("/current", async (req, res, next) => {
  try {
    const { clientId } = req as ClientIdentityRequest;
    const workoutPlan = await WorkoutPlan.findOne({ clientId }).lean();

    res.json({ workoutPlan });
  } catch (error) {
    next(error);
  }
});

router.put("/current", async (req, res, next) => {
  try {
    const { clientId } = req as ClientIdentityRequest;
    const editedPreview = workoutPreviewSchema.parse(req.body.editedPreview);
    const workoutPlan = await WorkoutPlan.findOneAndUpdate(
      { clientId },
      {
        $set: {
          editedPreview,
          workoutReviewed: false,
        },
      },
      { new: true }
    ).lean();

    if (!workoutPlan) {
      res.status(404).json({ error: "Workout plan not found." });
      return;
    }

    res.json({ workoutPlan });
  } catch (error) {
    next(error);
  }
});

router.post("/review", async (req, res, next) => {
  try {
    const { clientId } = req as ClientIdentityRequest;
    const workoutPlan = await WorkoutPlan.findOneAndUpdate(
      { clientId },
      { $set: { workoutReviewed: true } },
      { new: true }
    ).lean();

    if (!workoutPlan) {
      res.status(404).json({ error: "Workout plan not found." });
      return;
    }

    res.json({ workoutPlan });
  } catch (error) {
    next(error);
  }
});

export default router;
