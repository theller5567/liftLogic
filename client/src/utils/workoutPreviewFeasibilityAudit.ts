import { weightEstimationRules } from "../../../shared/constants/weightEstimationRules";
import type { OnboardingAnswers } from "../../../shared/types/onboarding.types";
import type { WorkoutSessionDto } from "../../../shared/types/workoutSession.types";
import {
  getLoadFeasibility,
  type LoadFeasibilityResult,
} from "../../../shared/utils/loadFeasibility";
import { resolveLoadFeasibilityCapacity } from "../../../shared/utils/loadFeasibilityCapacity";
import { normalizeLibraryIdToEstimatorKey } from "../../../shared/utils/exerciseLibraryAdapter";
import type {
  GeneratedWorkoutExercisePreview,
  GeneratedWorkoutPreview,
} from "./generateWorkoutPreview";

export type WorkoutPreviewFeasibilityAuditItem = {
  dayId: string;
  dayLabel: string;
  exerciseId: string;
  exerciseLabel: string;
  feasibility: LoadFeasibilityResult;
};

export type WorkoutPreviewFeasibilityAdjustment = WorkoutPreviewFeasibilityAuditItem & {
  adjustedWeight: number;
  originalWeight: number;
};

const isActionableFeasibility = (
  feasibility: LoadFeasibilityResult | undefined
) =>
  Boolean(
    feasibility &&
      feasibility.status === "too_heavy" &&
      feasibility.suggestedWeight !== undefined &&
      feasibility.assignedWeight !== undefined &&
      feasibility.suggestedWeight < feasibility.assignedWeight &&
      feasibility.source !== "default" &&
      feasibility.source !== "unknown"
  );

const getPreviewExerciseKey = (exercise: GeneratedWorkoutExercisePreview) =>
  `${exercise.id}:${exercise.exerciseId}`;

const getBaselineWeightsByExercise = (
  baselinePreview: GeneratedWorkoutPreview | undefined
) => {
  const weightsByExercise = new Map<string, number>();

  for (const day of baselinePreview?.days ?? []) {
    for (const exercise of day.exercises) {
      if (exercise.suggestedWeight !== undefined) {
        weightsByExercise.set(
          getPreviewExerciseKey(exercise),
          exercise.suggestedWeight
        );
      }
    }
  }

  return weightsByExercise;
};

export const getWorkoutPreviewExerciseFeasibility = ({
  assignedWeight,
  exercise,
  onboardingAnswers,
  workoutSessions,
}: {
  assignedWeight?: number;
  exercise: GeneratedWorkoutExercisePreview;
  onboardingAnswers?: OnboardingAnswers;
  workoutSessions?: WorkoutSessionDto[];
}) => {
  const resolvedAssignedWeight = assignedWeight ?? exercise.suggestedWeight;

  if (
    resolvedAssignedWeight === undefined ||
    exercise.weightUnit === undefined
  ) {
    return undefined;
  }

  const canonicalEstimatorKey = normalizeLibraryIdToEstimatorKey(
    exercise.exerciseId
  );

  if (!canonicalEstimatorKey) {
    return undefined;
  }

  const capacity = resolveLoadFeasibilityCapacity({
    canonicalEstimatorKey,
    exerciseId: exercise.exerciseId,
    experienceLevel: onboardingAnswers?.experienceLevel,
    onboardingAnswers,
    weightUnit: exercise.weightUnit,
    workoutSessions,
  });
  const equipmentType =
    weightEstimationRules.exerciseMeta[canonicalEstimatorKey].equipmentType;

  return getLoadFeasibility({
    assignedWeight: resolvedAssignedWeight,
    capacity: capacity.capacity,
    confidence: capacity.confidence,
    equipmentType,
    reps: exercise.prescription.reps,
    sets: exercise.prescription.sets,
    weightUnit: exercise.weightUnit,
  });
};

export const buildWorkoutPreviewFeasibilityAudit = ({
  baselinePreview,
  onboardingAnswers,
  preview,
  workoutSessions,
}: {
  baselinePreview?: GeneratedWorkoutPreview;
  onboardingAnswers?: OnboardingAnswers;
  preview: GeneratedWorkoutPreview;
  workoutSessions?: WorkoutSessionDto[];
}): WorkoutPreviewFeasibilityAuditItem[] => {
  const baselineWeightsByExercise = getBaselineWeightsByExercise(baselinePreview);

  return preview.days.flatMap((day) =>
    day.exercises.flatMap((exercise) => {
      const baselineWeight = baselineWeightsByExercise.get(
        getPreviewExerciseKey(exercise)
      );

      if (
        baselinePreview &&
        (baselineWeight === undefined ||
          exercise.suggestedWeight === undefined ||
          exercise.suggestedWeight <= baselineWeight)
      ) {
        return [];
      }

      const feasibility = getWorkoutPreviewExerciseFeasibility({
        exercise,
        onboardingAnswers,
        workoutSessions,
      });

      if (
        !feasibility ||
        (feasibility.status !== "limit" &&
          feasibility.status !== "too_heavy") ||
        feasibility.source === "default" ||
        feasibility.source === "unknown"
      ) {
        return [];
      }

      return [
        {
          dayId: day.id,
          dayLabel: day.label,
          exerciseId: exercise.exerciseId,
          exerciseLabel: exercise.label,
          feasibility,
        },
      ];
    })
  );
};

export const applyWorkoutPreviewFeasibilityAdjustments = ({
  onboardingAnswers,
  preview,
  workoutSessions,
}: {
  onboardingAnswers?: OnboardingAnswers;
  preview: GeneratedWorkoutPreview;
  workoutSessions?: WorkoutSessionDto[];
}): {
  adjustments: WorkoutPreviewFeasibilityAdjustment[];
  preview: GeneratedWorkoutPreview;
} => {
  const adjustments: WorkoutPreviewFeasibilityAdjustment[] = [];
  const adjustedPreview: GeneratedWorkoutPreview = {
    ...preview,
    days: preview.days.map((day) => ({
      ...day,
      exercises: day.exercises.map((exercise) => {
        const feasibility = getWorkoutPreviewExerciseFeasibility({
          exercise,
          onboardingAnswers,
          workoutSessions,
        });

        if (!isActionableFeasibility(feasibility)) {
          return exercise;
        }

        const adjustedWeight = feasibility!.suggestedWeight!;
        const originalWeight = feasibility!.assignedWeight!;

        adjustments.push({
          adjustedWeight,
          dayId: day.id,
          dayLabel: day.label,
          exerciseId: exercise.exerciseId,
          exerciseLabel: exercise.label,
          feasibility: feasibility!,
          originalWeight,
        });

        return {
          ...exercise,
          suggestedWeight: adjustedWeight,
        };
      }),
    })),
  };

  return {
    adjustments,
    preview: adjustedPreview,
  };
};
