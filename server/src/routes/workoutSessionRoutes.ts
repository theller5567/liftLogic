import { Router } from "express";
import { Types } from "mongoose";

import type {
  WorkoutExerciseLog,
  WorkoutSessionDto,
} from "../../../shared/types/workoutSession.types";
import type {
  GeneratedWorkoutDayPreview,
  GeneratedWorkoutExercisePreview,
  GeneratedWorkoutPreview,
} from "../../../shared/utils/generateWorkoutPreview";
import {
  requireClientIdentity,
  type ClientIdentityRequest,
} from "../middleware/clientIdentity";
import { WorkoutPlan } from "../models/WorkoutPlan";
import {
  WorkoutSession,
  type WorkoutSessionDocument,
} from "../models/WorkoutSession";
import {
  completeWorkoutSessionSchema,
  createWorkoutSessionSchema,
  updateWorkoutSessionSchema,
  workoutSessionQuerySchema,
} from "../schemas/workoutApiSchemas";

const router = Router();

router.use(requireClientIdentity);

const getActivePreview = (workoutPlan: {
  editedPreview?: GeneratedWorkoutPreview | null;
  suggestedPreview: GeneratedWorkoutPreview;
}) => workoutPlan.editedPreview ?? workoutPlan.suggestedPreview;

const createSetLogs = (exercise: GeneratedWorkoutExercisePreview) =>
  Array.from({ length: exercise.prescription.sets }, (_, index) => ({
    setNumber: index + 1,
    targetReps: exercise.prescription.reps,
    weight: exercise.suggestedWeight,
    weightUnit: exercise.weightUnit,
    completed: false,
  }));

const createExerciseLog = (
  exercise: GeneratedWorkoutExercisePreview
): WorkoutExerciseLog => ({
  slotId: exercise.id,
  plannedExerciseId: exercise.exerciseId,
  plannedLabel: exercise.label,
  exerciseId: exercise.exerciseId,
  label: exercise.label,
  wasSubstituted: false,
  prescriptionSnapshot: {
    ...exercise.prescription,
    suggestedWeight: exercise.suggestedWeight,
    weightUnit: exercise.weightUnit,
  },
  sets: createSetLogs(exercise),
  notes: exercise.notes,
  badgeIds: [],
  completed: false,
});

const createWorkoutSnapshot = (workoutDay: GeneratedWorkoutDayPreview) => ({
  id: workoutDay.id,
  label: workoutDay.label,
  focus: workoutDay.focus,
  exercises: workoutDay.exercises,
});

const getCompletionStats = (exerciseLogs: WorkoutExerciseLog[]) => {
  const totalExerciseCount = exerciseLogs.length;
  const completedExerciseCount = exerciseLogs.filter(
    (exerciseLog) => exerciseLog.completed
  ).length;
  const completionPercentage =
    totalExerciseCount === 0
      ? 0
      : Math.round((completedExerciseCount / totalExerciseCount) * 100);

  return {
    completedExerciseCount,
    completionPercentage,
    totalExerciseCount,
  };
};

const serializeWorkoutSession = (
  session: WorkoutSessionDocument & { _id: Types.ObjectId }
): WorkoutSessionDto => ({
  _id: session._id.toString(),
  clientId: session.clientId,
  workoutPlanId: session.workoutPlanId.toString(),
  programId: session.programId,
  programDayId: session.programDayId,
  programDayLabel: session.programDayLabel,
  scheduledFor: session.scheduledFor.toISOString(),
  startedAt: session.startedAt.toISOString(),
  completedAt: session.completedAt?.toISOString() ?? null,
  status: session.status,
  workoutSnapshot: session.workoutSnapshot,
  completionPercentage: session.completionPercentage,
  completedExerciseCount: session.completedExerciseCount,
  totalExerciseCount: session.totalExerciseCount,
  notes: session.notes,
  badgeIds: session.badgeIds,
  durationSeconds: session.durationSeconds,
  exerciseLogs: session.exerciseLogs,
  createdAt: session.createdAt.toISOString(),
  updatedAt: session.updatedAt.toISOString(),
});

const findOwnedSession = async (clientId: string, sessionId: string) => {
  if (!Types.ObjectId.isValid(sessionId)) {
    return null;
  }

  return WorkoutSession.findOne({
    _id: sessionId,
    clientId,
  });
};

router.get("/", async (req, res, next) => {
  try {
    const { clientId } = req as unknown as ClientIdentityRequest;
    const query = workoutSessionQuerySchema.parse(req.query);
    const filters: {
      clientId: string;
      scheduledFor?: { $gte?: Date; $lte?: Date };
      status?: string;
    } = { clientId };

    if (query.dateFrom || query.dateTo) {
      filters.scheduledFor = {
        ...(query.dateFrom ? { $gte: query.dateFrom } : {}),
        ...(query.dateTo ? { $lte: query.dateTo } : {}),
      };
    }

    if (query.status) {
      filters.status = query.status;
    }

    const workoutSessions = await WorkoutSession.find(filters)
      .sort({ scheduledFor: 1, startedAt: 1 })
      .lean<WorkoutSessionDocument[]>();

    res.json({
      workoutSessions: workoutSessions.map((session) =>
        serializeWorkoutSession(session as WorkoutSessionDocument & { _id: Types.ObjectId })
      ),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:sessionId", async (req, res, next) => {
  try {
    const { clientId } = req as unknown as ClientIdentityRequest;
    const workoutSession = await findOwnedSession(clientId, req.params.sessionId);

    if (!workoutSession) {
      res.status(404).json({
        code: "WORKOUT_SESSION_NOT_FOUND",
        error: "Workout session not found.",
      });
      return;
    }

    res.json({ workoutSession: serializeWorkoutSession(workoutSession) });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { clientId } = req as unknown as ClientIdentityRequest;
    const { programDayId, scheduledFor, startedAt } =
      createWorkoutSessionSchema.parse(req.body);
    const workoutPlan = await WorkoutPlan.findOne({
      clientId,
      workoutReviewed: true,
    });

    if (!workoutPlan) {
      res.status(404).json({
        code: "WORKOUT_PLAN_NOT_FOUND",
        error: "Reviewed workout plan not found.",
      });
      return;
    }

    const preview = getActivePreview(workoutPlan);
    const workoutDay = preview.days.find((day) => day.id === programDayId);

    if (!workoutDay) {
      res.status(404).json({
        code: "WORKOUT_DAY_NOT_FOUND",
        error: "Workout day not found in current plan.",
      });
      return;
    }

    const exerciseLogs = workoutDay.exercises.map(createExerciseLog);
    const completionStats = getCompletionStats(exerciseLogs);
    const workoutSession = await WorkoutSession.create({
      clientId,
      workoutPlanId: workoutPlan._id,
      programId: preview.programId,
      programDayId: workoutDay.id,
      programDayLabel: workoutDay.label,
      scheduledFor,
      startedAt: startedAt ?? new Date(),
      status: "in_progress",
      workoutSnapshot: createWorkoutSnapshot(workoutDay),
      ...completionStats,
      badgeIds: [],
      exerciseLogs,
    });

    res.status(201).json({
      workoutSession: serializeWorkoutSession(workoutSession),
    });
  } catch (error) {
    next(error);
  }
});

router.put("/:sessionId", async (req, res, next) => {
  try {
    const { clientId } = req as unknown as ClientIdentityRequest;
    const updates = updateWorkoutSessionSchema.parse(req.body);
    const workoutSession = await findOwnedSession(clientId, req.params.sessionId);

    if (!workoutSession) {
      res.status(404).json({
        code: "WORKOUT_SESSION_NOT_FOUND",
        error: "Workout session not found.",
      });
      return;
    }

    if (workoutSession.status === "completed") {
      res.status(409).json({
        code: "WORKOUT_SESSION_COMPLETED",
        error: "Completed workout sessions cannot be updated.",
      });
      return;
    }

    if (updates.exerciseLogs) {
      workoutSession.exerciseLogs = updates.exerciseLogs;
      workoutSession.set(getCompletionStats(updates.exerciseLogs));
    }

    if (updates.scheduledFor) {
      workoutSession.scheduledFor = updates.scheduledFor;
    }

    if (updates.startedAt) {
      workoutSession.startedAt = updates.startedAt;
    }

    if (updates.notes !== undefined) {
      workoutSession.notes = updates.notes ?? undefined;
    }

    if (updates.badgeIds) {
      workoutSession.badgeIds = updates.badgeIds;
    }

    if (updates.durationSeconds !== undefined) {
      workoutSession.durationSeconds = updates.durationSeconds;
    }

    if (updates.status) {
      workoutSession.status = updates.status;
    }

    await workoutSession.save();

    res.json({ workoutSession: serializeWorkoutSession(workoutSession) });
  } catch (error) {
    next(error);
  }
});

router.post("/:sessionId/complete", async (req, res, next) => {
  try {
    const { clientId } = req as unknown as ClientIdentityRequest;
    const updates = completeWorkoutSessionSchema.parse(req.body);
    const workoutSession = await findOwnedSession(clientId, req.params.sessionId);

    if (!workoutSession) {
      res.status(404).json({
        code: "WORKOUT_SESSION_NOT_FOUND",
        error: "Workout session not found.",
      });
      return;
    }

    if (updates.exerciseLogs) {
      workoutSession.exerciseLogs = updates.exerciseLogs;
    }

    workoutSession.set(getCompletionStats(workoutSession.exerciseLogs));
    workoutSession.status = "completed";
    workoutSession.completedAt = updates.completedAt ?? new Date();

    if (updates.notes !== undefined) {
      workoutSession.notes = updates.notes ?? undefined;
    }

    if (updates.badgeIds) {
      workoutSession.badgeIds = updates.badgeIds;
    }

    if (updates.durationSeconds !== undefined) {
      workoutSession.durationSeconds = updates.durationSeconds;
    }

    await workoutSession.save();

    res.json({ workoutSession: serializeWorkoutSession(workoutSession) });
  } catch (error) {
    next(error);
  }
});

export default router;
