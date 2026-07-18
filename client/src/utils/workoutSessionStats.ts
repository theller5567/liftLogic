import type {
  WorkoutExerciseLog,
  WorkoutSessionDto,
} from "../../../shared/types/workoutSession.types";

export const getCompletedExerciseCount = (
  exerciseLogs: WorkoutExerciseLog[]
) => exerciseLogs.filter((exerciseLog) => exerciseLog.completed).length;

export const getTotalExerciseCount = (exerciseLogs: WorkoutExerciseLog[]) =>
  exerciseLogs.length;

export const areAllWorkoutExercisesCompleted = (
  exerciseLogs: WorkoutExerciseLog[]
) =>
  exerciseLogs.length > 0 &&
  exerciseLogs.every((exerciseLog) => exerciseLog.completed);

export const getWorkoutCompletionPercentage = (
  exerciseLogs: WorkoutExerciseLog[]
) => {
  const totalExerciseCount = getTotalExerciseCount(exerciseLogs);

  if (totalExerciseCount === 0) {
    return 0;
  }

  return Math.round(
    (getCompletedExerciseCount(exerciseLogs) / totalExerciseCount) * 100
  );
};

export const getNextIncompleteExerciseIndex = (
  exerciseLogs: WorkoutExerciseLog[]
) => exerciseLogs.findIndex((exerciseLog) => !exerciseLog.completed);

export const getCompletedSetCount = (exerciseLogs: WorkoutExerciseLog[]) =>
  exerciseLogs.reduce(
    (totalSets, exerciseLog) =>
      totalSets + exerciseLog.sets.filter((setLog) => setLog.completed).length,
    0
  );

export const getTotalSetCount = (exerciseLogs: WorkoutExerciseLog[]) =>
  exerciseLogs.reduce(
    (totalSets, exerciseLog) => totalSets + exerciseLog.sets.length,
    0
  );

export const isWorkoutSessionCompleted = (session: WorkoutSessionDto) =>
  session.status === "completed" ||
  areAllWorkoutExercisesCompleted(session.exerciseLogs);
