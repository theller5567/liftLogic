import { Router } from "express";

import type { WorkoutFocusBlock } from "../../../shared/types/workoutFocus.types";
import type { WorkoutProgramHistoryEntry } from "../../../shared/types/workoutPlan.types";
import type { GeneratedWorkoutPreview } from "../../../shared/utils/generateWorkoutPreview";
import {
  createProgramHistoryEntry,
  resetProgramHistoryForPreview,
  resolveProgramHistoryForPreview,
} from "../../../shared/utils/workoutProgramHistory";
import {
  createWorkoutFocusBlock,
  isWorkoutFocusBlockActive,
} from "../../../shared/utils/workoutFocus";
import { WorkoutPlan } from "../models/WorkoutPlan";
import { WorkoutSession } from "../models/WorkoutSession";
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
    const workoutPlan = await WorkoutPlan.findOne({ clientId });

    if (!workoutPlan) {
      res.status(404).json({
        code: "WORKOUT_PLAN_NOT_FOUND",
        error: "Workout plan not found.",
      });
      return;
    }

    const historyBaseline = getSeededProgramHistory({
      existingProgramHistory: workoutPlan.programHistory,
      existingProgramVersion: workoutPlan.programVersion,
      fallbackPreview: getBaseWorkoutPreview(workoutPlan),
      planCreatedAt: workoutPlan.createdAt,
      workoutPlanId: workoutPlan._id.toString(),
    });
    const programHistoryState = resolveProgramHistoryForPreview({
      activeProgramHistoryId: workoutPlan.activeProgramHistoryId,
      history: historyBaseline,
      now: new Date(),
      preview: editedPreview,
      switchReason: "manual_switch",
      workoutPlanId: workoutPlan._id.toString(),
    });

    workoutPlan.set({
      editedPreview,
      workoutReviewed: false,
      ...programHistoryState,
    });
    await workoutPlan.save();

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

router.post("/reset-progress", async (req, res, next) => {
  try {
    const { clientId } = req as ClientIdentityRequest;
    const workoutPlan = await WorkoutPlan.findOne({ clientId });

    if (!workoutPlan) {
      res.status(404).json({
        code: "WORKOUT_PLAN_NOT_FOUND",
        error: "Workout plan not found.",
      });
      return;
    }

    const currentPreview = getBaseWorkoutPreview(workoutPlan);
    const previousProgramHistoryId =
      workoutPlan.activeProgramHistoryId ??
      `program-history-${workoutPlan.programVersion ?? 1}`;
    const historyBaseline = getSeededProgramHistory({
      existingProgramHistory: workoutPlan.programHistory,
      existingProgramVersion: workoutPlan.programVersion,
      fallbackPreview: currentPreview,
      planCreatedAt: workoutPlan.createdAt,
      workoutPlanId: workoutPlan._id.toString(),
    });
    const programHistoryState = resetProgramHistoryForPreview({
      activeProgramHistoryId: workoutPlan.activeProgramHistoryId,
      history: historyBaseline,
      now: new Date(),
      preview: currentPreview,
      programVersion: workoutPlan.programVersion,
      workoutPlanId: workoutPlan._id.toString(),
    });

    workoutPlan.set(programHistoryState);
    await workoutPlan.save();

    const abandonedSessions = await WorkoutSession.updateMany(
      {
        clientId,
        workoutPlanId: workoutPlan._id,
        status: "in_progress",
        $or: [
          { deletedAt: { $exists: false } },
          { deletedAt: null },
        ],
        $and: [
          {
            $or: [
              { programHistoryId: previousProgramHistoryId },
              {
                programHistoryId: { $exists: false },
                programId: currentPreview.programId,
              },
            ],
          },
        ],
      },
      {
        $set: {
          status: "abandoned",
        },
      }
    );

    res.json({
      abandonedWorkoutSessionCount: abandonedSessions.modifiedCount,
      workoutPlan,
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/current", async (req, res, next) => {
  try {
    const { clientId } = req as ClientIdentityRequest;
    const workoutPlan = await WorkoutPlan.findOne({ clientId });

    if (!workoutPlan) {
      res.status(404).json({
        code: "WORKOUT_PLAN_NOT_FOUND",
        error: "Workout plan not found.",
      });
      return;
    }

    const abandonedSessions = await WorkoutSession.updateMany(
      {
        clientId,
        workoutPlanId: workoutPlan._id,
        status: "in_progress",
        $or: [
          { deletedAt: { $exists: false } },
          { deletedAt: null },
        ],
      },
      {
        $set: {
          status: "abandoned",
        },
      }
    );

    await workoutPlan.deleteOne();

    res.json({
      abandonedWorkoutSessionCount: abandonedSessions.modifiedCount,
      workoutPlan: null,
    });
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
