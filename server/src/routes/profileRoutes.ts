import { Router } from "express";

import { generateWorkoutPreview } from "../../../shared/utils/generateWorkoutPreview";
import {
  createDefaultUserSettings,
  mergeUserSettings,
} from "../../../shared/types/userSettings.types";
import { UserProfile } from "../models/UserProfile";
import { UserSettingsModel } from "../models/UserSettings";
import { WorkoutPlan } from "../models/WorkoutPlan";
import {
  requireClientIdentity,
  type ClientIdentityRequest,
} from "../middleware/clientIdentity";
import {
  onboardingSubmissionSchema,
  userSettingsSubmissionSchema,
} from "../schemas/workoutApiSchemas";

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
    const persistedSettings = await UserSettingsModel.findOne({ clientId }).lean();
    const userSettings = mergeUserSettings(
      persistedSettings,
      workoutPlan?.onboardingAnswers
    );

    res.json({ profile, workoutPlan, userSettings });
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
    const existingSettings = await UserSettingsModel.findOne({ clientId }).lean();

    if (!existingSettings) {
      await UserSettingsModel.create({
        clientId,
        ...createDefaultUserSettings(answers),
      });
    }

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

router.put("/settings", async (req, res, next) => {
  try {
    const identityRequest = req as ClientIdentityRequest;
    const { clientId } = identityRequest;
    const { settings } = userSettingsSubmissionSchema.parse(req.body);

    const userSettings = await UserSettingsModel.findOneAndUpdate(
      { clientId },
      {
        $set: {
          clientId,
          ...settings,
        },
      },
      { new: true, upsert: true }
    ).lean();

    res.json({ userSettings: mergeUserSettings(userSettings) });
  } catch (error) {
    next(error);
  }
});

export default router;
