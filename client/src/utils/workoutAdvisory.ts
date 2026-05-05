import type {
  WorkoutExerciseLog,
  WorkoutSessionDto,
  WorkoutSetLog,
} from "../../../shared/types/workoutSession.types";
import { getStartOfWeek } from "./workoutSessionDates";

type WeightIncreaseAdvisoryInput = {
  exerciseLog: WorkoutExerciseLog;
  previousWeight?: number;
  nextWeight?: number;
  currentSession: WorkoutSessionDto;
  priorSessions: WorkoutSessionDto[];
};

const normalizeLabel = (label: string) =>
  label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");

export const getExerciseHistoryKey = (exerciseLog: WorkoutExerciseLog) =>
  exerciseLog.exerciseId ||
  exerciseLog.plannedExerciseId ||
  normalizeLabel(exerciseLog.label);

export const getProgressionTargetReps = (targetReps?: string) => {
  if (!targetReps) {
    return null;
  }

  const repValues = targetReps.match(/\d+/g)?.map(Number) ?? [];

  if (repValues.length === 0) {
    return null;
  }

  return Math.max(...repValues);
};

const weightsMatch = (left?: number, right?: number) =>
  left !== undefined && right !== undefined && Math.abs(left - right) < 0.001;

const getSetsAtWeight = (sets: WorkoutSetLog[], weight?: number) =>
  sets.filter((set) => weightsMatch(set.weight, weight));

const completedTargetAtWeight = (
  exerciseLog: WorkoutExerciseLog,
  weight?: number
) => {
  const targetReps = getProgressionTargetReps(
    exerciseLog.prescriptionSnapshot.reps
  );

  if (weight === undefined || targetReps === null) {
    return null;
  }

  const setsAtWeight = getSetsAtWeight(exerciseLog.sets, weight);
  const completedSetsAtWeight = setsAtWeight.filter((set) => set.completed);

  if (completedSetsAtWeight.length === 0) {
    return null;
  }

  const requiredSetCount = exerciseLog.prescriptionSnapshot.sets;
  const completedTargetSetCount = completedSetsAtWeight.filter(
    (set) => (set.actualReps ?? 0) >= targetReps
  ).length;

  return (
    completedSetsAtWeight.length >= requiredSetCount &&
    completedTargetSetCount >= requiredSetCount
  );
};

const sameExercise = (
  exerciseLog: WorkoutExerciseLog,
  candidateLog: WorkoutExerciseLog
) => getExerciseHistoryKey(exerciseLog) === getExerciseHistoryKey(candidateLog);

export const getMostRecentPriorWeekExerciseLog = (
  exerciseLog: WorkoutExerciseLog,
  currentSession: WorkoutSessionDto,
  priorSessions: WorkoutSessionDto[]
) => {
  const currentWeekStart = getStartOfWeek(new Date(currentSession.scheduledFor));

  return [...priorSessions]
    .filter(
      (session) =>
        session.status === "completed" &&
        new Date(session.scheduledFor) < currentWeekStart
    )
    .sort(
      (left, right) =>
        new Date(right.scheduledFor).getTime() -
        new Date(left.scheduledFor).getTime()
    )
    .flatMap((session) => session.exerciseLogs)
    .find((candidateLog) => sameExercise(exerciseLog, candidateLog));
};

export const shouldShowWeightIncreaseAdvisory = ({
  currentSession,
  exerciseLog,
  nextWeight,
  previousWeight,
  priorSessions,
}: WeightIncreaseAdvisoryInput) => {
  if (
    previousWeight === undefined ||
    nextWeight === undefined ||
    nextWeight <= previousWeight
  ) {
    return false;
  }

  const sameSessionResult = completedTargetAtWeight(exerciseLog, previousWeight);

  if (sameSessionResult === false) {
    return true;
  }

  if (sameSessionResult === true) {
    return false;
  }

  const priorExerciseLog = getMostRecentPriorWeekExerciseLog(
    exerciseLog,
    currentSession,
    priorSessions
  );

  if (!priorExerciseLog) {
    return false;
  }

  return completedTargetAtWeight(priorExerciseLog, previousWeight) === false;
};
