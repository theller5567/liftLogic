import type {
  WorkoutExerciseLog,
  WorkoutSetLog,
} from "../../../shared/types/workoutSession.types";
import { getProgressionTargetReps } from "./workoutAdvisory";

export const formatTimer = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

export const getDefaultReps = (set: WorkoutSetLog) =>
  set.actualReps ?? getProgressionTargetReps(set.targetReps) ?? 0;

export const getDefaultWeight = (
  exerciseLog: WorkoutExerciseLog,
  set: WorkoutSetLog
) => set.weight ?? exerciseLog.prescriptionSnapshot.suggestedWeight ?? 0;

export const formatSetSummary = (setLog: WorkoutSetLog) =>
  `${setLog.weight ?? 0} ${setLog.weightUnit ?? ""} x ${
    setLog.actualReps ?? 0
  }`;

export const getActiveSetIndex = (sets: WorkoutSetLog[]) =>
  sets.findIndex((setLog) => !setLog.completed);
