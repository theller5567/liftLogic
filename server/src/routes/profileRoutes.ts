import { Router } from "express";

import { generateWorkoutPreview } from "../../../shared/utils/generateWorkoutPreview";
import { UserProfile } from "../models/UserProfile";
import { WorkoutPlan } from "../models/WorkoutPlan";
import {
  requireClientIdentity,
  type ClientIdentityRequest,
} from "../middleware/clientIdentity";
import { onboardingSubmissionSchema } from "../schemas/workoutApiSchemas";

const router = Router();

router.use(requireClientIdentity);

router.get("/current", async (req, res, next) => {
  try {
    const {
      authDisplayName,
      authEmail,
      authProvider,
      authUserId,
      clientId,
    } = req as ClientIdentityRequest;
    const profile = await UserProfile.findOneAndUpdate(
      { clientId },
      {
        $set: {
          authProvider,
          authUserId,
          displayName: authDisplayName ?? authEmail,
        },
        $setOnInsert: { clientId },
      },
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
    const {
      authDisplayName,
      authEmail,
      authProvider,
      authUserId,
      clientId,
    } = req as ClientIdentityRequest;
    const { answers } = onboardingSubmissionSchema.parse(req.body);
    const suggestedPreview = generateWorkoutPreview(answers);

    const profile = await UserProfile.findOneAndUpdate(
      { clientId },
      {
        $set: {
          authProvider,
          authUserId,
          displayName: authDisplayName ?? authEmail,
        },
        $setOnInsert: { clientId },
      },
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
