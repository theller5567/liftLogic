import { Router } from "express";
import { z } from "zod";

import { generateWorkoutPreview } from "../../../shared/utils/generateWorkoutPreview";
import { UserProfile } from "../models/UserProfile";
import { WorkoutPlan } from "../models/WorkoutPlan";
import {
  requireClientIdentity,
  type ClientIdentityRequest,
} from "../middleware/clientIdentity";

const onboardingAnswersSchema = z.object({}).passthrough();

const router = Router();

router.use(requireClientIdentity);

router.get("/current", async (req, res, next) => {
  try {
    const { clientId } = req as ClientIdentityRequest;
    const profile = await UserProfile.findOneAndUpdate(
      { clientId },
      { $setOnInsert: { clientId, authProvider: "anonymous" } },
      { new: true, upsert: true }
    ).lean();
    const workoutPlan = await WorkoutPlan.findOne({ clientId }).lean();

    res.json({ profile, workoutPlan });
  } catch (error) {
    next(error);
  }
});

router.put("/onboarding", async (req, res, next) => {
  try {
    const { clientId } = req as ClientIdentityRequest;
    const answers = onboardingAnswersSchema.parse(req.body.answers);
    const suggestedPreview = generateWorkoutPreview(answers);

    const profile = await UserProfile.findOneAndUpdate(
      { clientId },
      { $setOnInsert: { clientId, authProvider: "anonymous" } },
      { new: true, upsert: true }
    ).lean();

    const workoutPlan = await WorkoutPlan.findOneAndUpdate(
      { clientId },
      {
        $set: {
          clientId,
          onboardingAnswers: answers,
          suggestedPreview,
          editedPreview: null,
          workoutReviewed: false,
        },
      },
      { new: true, upsert: true }
    ).lean();

    res.json({ profile, workoutPlan });
  } catch (error) {
    next(error);
  }
});

export default router;
