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

const upsertCurrentUserProfile = (identityRequest: ClientIdentityRequest) =>
  UserProfile.findOneAndUpdate(
    { clientId: identityRequest.clientId },
    {
      $set: {
        authProvider: identityRequest.authProvider,
        authUserId: identityRequest.authUserId,
        displayName: identityRequest.authDisplayName ?? identityRequest.authEmail,
        email: identityRequest.authEmail,
        emailVerified: identityRequest.authEmailVerified,
        photoUrl: identityRequest.authPhotoUrl,
        lastLoginAt: new Date(),
      },
      $setOnInsert: { clientId: identityRequest.clientId },
    },
    { new: true, upsert: true }
  ).lean();

router.get("/current", async (req, res, next) => {
  try {
    const identityRequest = req as ClientIdentityRequest;
    const { clientId } = identityRequest;
    const profile = await upsertCurrentUserProfile(identityRequest);
    const workoutPlan = await WorkoutPlan.findOne({ clientId }).lean();

    res.json({ profile, workoutPlan });
  } catch (error) {
    next(error);
  }
});

router.put("/onboarding", async (req, res, next) => {
  try {
    const identityRequest = req as ClientIdentityRequest;
    const { clientId } = identityRequest;
    const { answers } = onboardingSubmissionSchema.parse(req.body);
    const suggestedPreview = generateWorkoutPreview(answers);

    const profile = await upsertCurrentUserProfile(identityRequest);

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
