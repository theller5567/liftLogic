import { Router } from "express";
import { Types } from "mongoose";

import { generateWorkoutPreview } from "../../../shared/utils/generateWorkoutPreview";
import type { GeneratedWorkoutPreview } from "../../../shared/utils/generateWorkoutPreview";
import {
  createDefaultUserSettings,
  mergeUserSettings,
} from "../../../shared/types/userSettings.types";
import type { WorkoutProgramHistoryEntry } from "../../../shared/types/workoutPlan.types";
import {
  createProgramHistoryEntry,
  resolveProgramHistoryForPreview,
} from "../../../shared/utils/workoutProgramHistory";
import { UserProfile } from "../models/UserProfile";
import { UserSettingsModel } from "../models/UserSettings";
import { WorkoutPlan } from "../models/WorkoutPlan";
import { WorkoutSession } from "../models/WorkoutSession";
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

const getBaseWorkoutPreview = (workoutPlan: {
  editedPreview?: GeneratedWorkoutPreview | null;
  suggestedPreview: GeneratedWorkoutPreview;
}) => workoutPlan.editedPreview ?? workoutPlan.suggestedPreview;

const getSeededProgramHistory = ({
  existingProgramHistory,
  existingProgramVersion,
  fallbackPreview,
  planCreatedAt,
  workoutPlanId,
}: {
  existingProgramHistory?: WorkoutProgramHistoryEntry[];
  existingProgramVersion?: number;
  fallbackPreview: GeneratedWorkoutPreview;
  planCreatedAt: Date;
  workoutPlanId: string;
}) => {
  if (existingProgramHistory?.length) {
    return existingProgramHistory;
  }

  return [
    createProgramHistoryEntry({
      now: planCreatedAt,
      preview: fallbackPreview,
      programVersion: existingProgramVersion ?? 1,
      switchReason: "onboarding",
      workoutPlanId,
    }),
  ];
};

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
    const { answers, switchOptions } = onboardingSubmissionSchema.parse(req.body);
    const suggestedPreview = generateWorkoutPreview(answers);

    const profile = await upsertCurrentUserProfile(identityRequest);
    const existingSettings = await UserSettingsModel.findOne({ clientId }).lean();

    if (!existingSettings) {
      await UserSettingsModel.create({
        clientId,
        ...createDefaultUserSettings(answers),
      });
    }

    const existingWorkoutPlan = await WorkoutPlan.findOne({ clientId });
    const now = new Date();
    const workoutPlanId =
      existingWorkoutPlan?._id?.toString() ?? new Types.ObjectId().toString();
    const historyBaseline = existingWorkoutPlan
      ? getSeededProgramHistory({
          existingProgramHistory: existingWorkoutPlan.programHistory,
          existingProgramVersion: existingWorkoutPlan.programVersion,
          fallbackPreview: getBaseWorkoutPreview(existingWorkoutPlan),
          planCreatedAt: existingWorkoutPlan.createdAt,
          workoutPlanId,
        })
      : [];
    const existingPreview = existingWorkoutPlan
      ? getBaseWorkoutPreview(existingWorkoutPlan)
      : null;
    const initialOnboardingAnswers =
      existingWorkoutPlan?.initialOnboardingAnswers ??
      existingWorkoutPlan?.onboardingAnswers ??
      answers;
    const isProgramSwitch =
      Boolean(existingWorkoutPlan) &&
      existingPreview?.programId !== suggestedPreview.programId;
    const previousProgramHistoryId = existingWorkoutPlan
      ? existingWorkoutPlan.activeProgramHistoryId ??
        `program-history-${existingWorkoutPlan.programVersion ?? 1}`
      : null;
    const programHistoryState = resolveProgramHistoryForPreview({
      activeProgramHistoryId: existingWorkoutPlan?.activeProgramHistoryId,
      history: historyBaseline,
      now,
      preview: suggestedPreview,
      switchReason: existingWorkoutPlan ? "manual_switch" : "onboarding",
      workoutPlanId,
    });

    if (
      isProgramSwitch &&
      (switchOptions?.abandonInProgressSessions ?? true) &&
      previousProgramHistoryId &&
      existingPreview
    ) {
      await WorkoutSession.updateMany(
        {
          clientId,
          deletedAt: { $exists: false },
          status: "in_progress",
          workoutPlanId: existingWorkoutPlan?._id,
          $or: [
            { programHistoryId: previousProgramHistoryId },
            {
              programHistoryId: { $exists: false },
              programId: existingPreview.programId,
            },
          ],
        },
        { $set: { status: "abandoned" } }
      );
    }

    const workoutPlan = await WorkoutPlan.findOneAndUpdate(
      { clientId },
      {
        $set: {
          clientId,
          initialOnboardingAnswers,
          onboardingAnswers: answers,
          suggestedPreview,
          editedPreview: null,
          workoutReviewed: false,
          ...programHistoryState,
        },
        $setOnInsert: {
          _id: workoutPlanId,
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

router.delete("/app-data", async (req, res, next) => {
  try {
    const { clientId } = req as ClientIdentityRequest;
    const [
      deletedWorkoutSessions,
      deletedWorkoutPlans,
      deletedUserSettings,
      deletedUserProfiles,
    ] = await Promise.all([
      WorkoutSession.deleteMany({ clientId }),
      WorkoutPlan.deleteMany({ clientId }),
      UserSettingsModel.deleteMany({ clientId }),
      UserProfile.deleteMany({ clientId }),
    ]);

    res.json({
      deletedCounts: {
        workoutSessions: deletedWorkoutSessions.deletedCount,
        workoutPlans: deletedWorkoutPlans.deletedCount,
        userSettings: deletedUserSettings.deletedCount,
        userProfiles: deletedUserProfiles.deletedCount,
      },
      firebaseAccountDeleted: false,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
