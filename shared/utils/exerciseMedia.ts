import { exerciseLibrary } from "../constants/exercise-library";
import type {
  ExerciseMedia,
  ExerciseMediaResponse,
  ExerciseMediaUnavailableReason,
} from "../types/exerciseMedia.types";
import { getExerciseById } from "./exerciseLibraryAdapter";

export function getExerciseMediaMetadata(
  exerciseId: string
): ExerciseMedia | undefined {
  return getExerciseById(exerciseId)?.media;
}

export function getExerciseInstructionFallback(exerciseId: string): string[] {
  const exercise = getExerciseById(exerciseId);

  return exercise?.media?.instructions ?? exercise?.notes ?? [];
}

export function canShowExerciseMediaAction(exerciseId: string) {
  const media = getExerciseMediaMetadata(exerciseId);

  return Boolean(media?.providerExerciseId || getExerciseInstructionFallback(exerciseId).length);
}

export function createUnavailableExerciseMediaResponse(
  exerciseId: string,
  reason: ExerciseMediaUnavailableReason
): ExerciseMediaResponse {
  const instructions = getExerciseInstructionFallback(exerciseId);

  return {
    status: "unavailable",
    exerciseId,
    reason,
    ...(instructions.length ? { instructions } : {}),
  };
}

export function getWorkoutTemplateExerciseIds() {
  return [
    ...new Set(
      exerciseLibrary.workoutTemplates.flatMap((template) =>
        template.workoutDays.flatMap((day) =>
          day.type === "workout" ? day.exerciseIds : []
        )
      )
    ),
  ];
}

export function getWorkoutTemplateMediaCoverage() {
  const exerciseIds = getWorkoutTemplateExerciseIds();
  const mappedExerciseIds = exerciseIds.filter(
    (exerciseId) => Boolean(getExerciseMediaMetadata(exerciseId)?.providerExerciseId)
  );
  const instructionOnlyExerciseIds = exerciseIds.filter(
    (exerciseId) =>
      !getExerciseMediaMetadata(exerciseId)?.providerExerciseId &&
      getExerciseInstructionFallback(exerciseId).length > 0
  );

  return {
    totalTemplateExercises: exerciseIds.length,
    mappedExerciseIds,
    instructionOnlyExerciseIds,
    missingExerciseIds: exerciseIds.filter(
      (exerciseId) =>
        !mappedExerciseIds.includes(exerciseId) &&
        !instructionOnlyExerciseIds.includes(exerciseId)
    ),
  };
}
