import type {
  WorkoutExerciseLog,
  WorkoutSessionDto,
  WorkoutSetLog,
} from "../../../shared/types/workoutSession.types";
import { getExerciseById } from "../../../shared/utils/exerciseLibraryAdapter";
import { isCompoundExercise } from "../../../shared/utils/exerciseIntelligence";
import { filterActiveWorkoutSessions } from "../../../shared/utils/workoutSessionScope";

export type PersonalRecordType =
  | "heaviest_weight"
  | "most_reps_at_weight"
  | "highest_exercise_volume"
  | "best_estimated_one_rep_max";

export type PersonalRecord = {
  exerciseId: string;
  label: string;
  type: PersonalRecordType;
  previousValue?: number;
  value: number;
  weightUnit?: string;
};

const getCompletedWeightedSets = (exerciseLog: WorkoutExerciseLog) =>
  exerciseLog.sets.filter(
    (setLog) =>
      setLog.completed &&
      setLog.weight !== undefined &&
      setLog.weight > 0 &&
      setLog.actualReps !== undefined &&
      setLog.actualReps > 0
  );

const getSetVolume = (setLog: WorkoutSetLog) =>
  setLog.completed && setLog.weight !== undefined && setLog.actualReps !== undefined
    ? setLog.weight * setLog.actualReps
    : 0;

export const getExerciseVolume = (exerciseLog: WorkoutExerciseLog) =>
  exerciseLog.sets.reduce((total, setLog) => total + getSetVolume(setLog), 0);

const getEstimatedOneRepMax = (setLog: WorkoutSetLog) => {
  if (
    !setLog.completed ||
    setLog.weight === undefined ||
    setLog.actualReps === undefined ||
    setLog.weight <= 0 ||
    setLog.actualReps <= 0
  ) {
    return null;
  }

  return setLog.weight * (1 + setLog.actualReps / 30);
};

const getBestEstimatedOneRepMax = (exerciseLog: WorkoutExerciseLog) => {
  const estimates = exerciseLog.sets
    .map(getEstimatedOneRepMax)
    .filter((estimate): estimate is number => estimate !== null);

  return estimates.length > 0 ? Math.max(...estimates) : null;
};

const getTopWeight = (exerciseLog: WorkoutExerciseLog) => {
  const weightedSets = getCompletedWeightedSets(exerciseLog);

  if (weightedSets.length === 0) {
    return null;
  }

  return Math.max(...weightedSets.map((setLog) => setLog.weight ?? 0));
};

const getWeightUnitForTopSet = (
  exerciseLog: WorkoutExerciseLog,
  topWeight: number
) =>
  getCompletedWeightedSets(exerciseLog).find(
    (setLog) => setLog.weight === topWeight
  )?.weightUnit ?? exerciseLog.prescriptionSnapshot.weightUnit;

const getBestRepsByWeight = (exerciseLog: WorkoutExerciseLog) => {
  const bestRepsByWeight = new Map<number, number>();

  for (const setLog of getCompletedWeightedSets(exerciseLog)) {
    const weight = setLog.weight ?? 0;
    const reps = setLog.actualReps ?? 0;
    const currentBest = bestRepsByWeight.get(weight) ?? 0;

    if (reps > currentBest) {
      bestRepsByWeight.set(weight, reps);
    }
  }

  return bestRepsByWeight;
};

const getPriorExerciseLogs = (
  sessions: WorkoutSessionDto[],
  currentSession: WorkoutSessionDto,
  exerciseId: string
) => {
  const currentSessionTime = new Date(currentSession.scheduledFor).getTime();

  return sessions
    .filter(
      (session) =>
        session.status === "completed" &&
        session._id !== currentSession._id &&
        new Date(session.scheduledFor).getTime() < currentSessionTime
    )
    .flatMap((session) => session.exerciseLogs)
    .filter((exerciseLog) => exerciseLog.exerciseId === exerciseId);
};

const findExercisePersonalRecords = (
  exerciseLog: WorkoutExerciseLog,
  priorExerciseLogs: WorkoutExerciseLog[]
): PersonalRecord[] => {
  if (priorExerciseLogs.length === 0) {
    return [];
  }

  const records: PersonalRecord[] = [];
  const topWeight = getTopWeight(exerciseLog);
  const priorTopWeights = priorExerciseLogs
    .map(getTopWeight)
    .filter((weight): weight is number => weight !== null);
  const priorTopWeight =
    priorTopWeights.length > 0 ? Math.max(...priorTopWeights) : null;

  if (topWeight !== null && priorTopWeight !== null && topWeight > priorTopWeight) {
    records.push({
      exerciseId: exerciseLog.exerciseId,
      label: exerciseLog.label,
      previousValue: priorTopWeight,
      type: "heaviest_weight",
      value: topWeight,
      weightUnit: getWeightUnitForTopSet(exerciseLog, topWeight),
    });
  }

  const currentBestRepsByWeight = getBestRepsByWeight(exerciseLog);
  const priorBestRepsByWeight = priorExerciseLogs.reduce((bestByWeight, priorLog) => {
    for (const [weight, reps] of getBestRepsByWeight(priorLog)) {
      const currentBest = bestByWeight.get(weight) ?? 0;

      if (reps > currentBest) {
        bestByWeight.set(weight, reps);
      }
    }

    return bestByWeight;
  }, new Map<number, number>());

  for (const [weight, reps] of currentBestRepsByWeight) {
    const priorBestReps = priorBestRepsByWeight.get(weight);

    if (priorBestReps !== undefined && reps > priorBestReps) {
      records.push({
        exerciseId: exerciseLog.exerciseId,
        label: exerciseLog.label,
        previousValue: priorBestReps,
        type: "most_reps_at_weight",
        value: reps,
        weightUnit: getWeightUnitForTopSet(exerciseLog, weight),
      });
    }
  }

  const exerciseVolume = getExerciseVolume(exerciseLog);
  const priorTopVolume = Math.max(
    ...priorExerciseLogs.map(getExerciseVolume).filter((volume) => volume > 0),
    0
  );

  if (exerciseVolume > 0 && priorTopVolume > 0 && exerciseVolume > priorTopVolume) {
    records.push({
      exerciseId: exerciseLog.exerciseId,
      label: exerciseLog.label,
      previousValue: priorTopVolume,
      type: "highest_exercise_volume",
      value: exerciseVolume,
      weightUnit: exerciseLog.prescriptionSnapshot.weightUnit,
    });
  }

  const estimatedOneRepMax = getBestEstimatedOneRepMax(exerciseLog);
  const priorOneRepMaxes = priorExerciseLogs
    .map(getBestEstimatedOneRepMax)
    .filter((estimate): estimate is number => estimate !== null);
  const priorBestOneRepMax =
    priorOneRepMaxes.length > 0 ? Math.max(...priorOneRepMaxes) : null;

  if (
    estimatedOneRepMax !== null &&
    priorBestOneRepMax !== null &&
    estimatedOneRepMax > priorBestOneRepMax
  ) {
    records.push({
      exerciseId: exerciseLog.exerciseId,
      label: exerciseLog.label,
      previousValue: priorBestOneRepMax,
      type: "best_estimated_one_rep_max",
      value: estimatedOneRepMax,
      weightUnit: exerciseLog.prescriptionSnapshot.weightUnit,
    });
  }

  return records;
};

export const getPersonalRecordsForSession = (
  sessions: WorkoutSessionDto[],
  sessionId: string
): PersonalRecord[] => {
  const activeSessions = filterActiveWorkoutSessions(sessions);
  const currentSession = activeSessions.find(
    (session) => session._id === sessionId && session.status === "completed"
  );

  if (!currentSession) {
    return [];
  }

  return currentSession.exerciseLogs.flatMap((exerciseLog) =>
    isCompoundExercise(getExerciseById(exerciseLog.exerciseId))
      ? findExercisePersonalRecords(
          exerciseLog,
          getPriorExerciseLogs(activeSessions, currentSession, exerciseLog.exerciseId)
        )
      : []
  );
};
