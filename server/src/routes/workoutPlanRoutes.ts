import { Router } from "express";

import type { WorkoutFocusBlock } from "../../../shared/types/workoutFocus.types";
import {
  createWorkoutFocusBlock,
  isWorkoutFocusBlockActive,
} from "../../../shared/utils/workoutFocus";
import { WorkoutPlan } from "../models/WorkoutPlan";
import {
  requireClientIdentity,
  type ClientIdentityRequest,
} from "../middleware/clientIdentity";
import {
  editedWorkoutPreviewSubmissionSchema,
  workoutFocusSubmissionSchema,
} from "../schemas/workoutApiSchemas";

const router = Router();

router.use(requireClientIdentity);

router.get("/current", async (req, res, next) => {
  try {
    const { clientId } = req as ClientIdentityRequest;
    const workoutPlan = await WorkoutPlan.findOne({ clientId }).lean();
    const currentWorkoutPlan =
      workoutPlan?.focusBlock &&
      !isWorkoutFocusBlockActive(workoutPlan.focusBlock as WorkoutFocusBlock)
        ? { ...workoutPlan, focusBlock: null }
        : workoutPlan;

    res.json({ workoutPlan: currentWorkoutPlan });
  } catch (error) {
    next(error);
  }
});

router.put("/current", async (req, res, next) => {
  try {
    const { clientId } = req as ClientIdentityRequest;
    const { editedPreview } = editedWorkoutPreviewSubmissionSchema.parse(req.body);
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
      res.status(404).json({
        code: "WORKOUT_PLAN_NOT_FOUND",
        error: "Workout plan not found.",
      });
      return;
    }

    res.json({ workoutPlan });
  } catch (error) {
    next(error);
  }
});

router.put("/focus", async (req, res, next) => {
  try {
    const { clientId } = req as ClientIdentityRequest;
    const { durationWeeks, focusArea, reviewedPreview } =
      workoutFocusSubmissionSchema.parse(req.body);
    const focusBlock = createWorkoutFocusBlock({
      durationWeeks,
      focusArea,
      reviewedPreview,
    });
    const workoutPlan = await WorkoutPlan.findOneAndUpdate(
      { clientId },
      { $set: { focusBlock } },
      { new: true }
    ).lean();

    if (!workoutPlan) {
      res.status(404).json({
        code: "WORKOUT_PLAN_NOT_FOUND",
        error: "Workout plan not found.",
      });
      return;
    }

    res.json({ workoutPlan });
  } catch (error) {
    next(error);
  }
});

router.delete("/focus", async (req, res, next) => {
  try {
    const { clientId } = req as ClientIdentityRequest;
    const workoutPlan = await WorkoutPlan.findOneAndUpdate(
      { clientId },
      { $set: { focusBlock: null } },
      { new: true }
    ).lean();

    if (!workoutPlan) {
      res.status(404).json({
        code: "WORKOUT_PLAN_NOT_FOUND",
        error: "Workout plan not found.",
      });
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
      res.status(404).json({
        code: "WORKOUT_PLAN_NOT_FOUND",
        error: "Workout plan not found.",
      });
      return;
    }

    res.json({ workoutPlan });
  } catch (error) {
    next(error);
  }
});

export default router;
