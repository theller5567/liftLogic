import type {
  WorkoutExerciseLog,
  WorkoutSessionDto,
} from "../../../shared/types/workoutSession.types";
import {
  getCompletedExerciseProgressionState,
  type ActionableProgressiveOverloadState,
} from "./workoutAdvisory";

export type ProgressionSummaryItem = {
  exerciseId: string;
  label: string;
  state: ActionableProgressiveOverloadState;
};

export type ProgressionSummary = {
  readyToProgress: ProgressionSummaryItem[];
  repeatWeight: ProgressionSummaryItem[];
  holdSteady: ProgressionSummaryItem[];
  reduceOrModify: ProgressionSummaryItem[];
};

const getLatestCompletedExerciseLogs = (sessions: WorkoutSessionDto[]) => {
  const latestExerciseLogs = new Map<
    string,
    { exerciseLog: WorkoutExerciseLog; time: number }
  >();

  for (const session of sessions) {
    if (session.status !== "completed") {
      continue;
    }

    const sessionTime = new Date(session.scheduledFor).getTime();

    for (const exerciseLog of session.exerciseLogs) {
      const current = latestExerciseLogs.get(exerciseLog.exerciseId);

      if (!current || sessionTime > current.time) {
        latestExerciseLogs.set(exerciseLog.exerciseId, {
          exerciseLog,
          time: sessionTime,
        });
      }
    }
  }

  return [...latestExerciseLogs.values()].map(({ exerciseLog }) => exerciseLog);
};

const createSummaryItem = (
  exerciseLog: WorkoutExerciseLog
): ProgressionSummaryItem => ({
  exerciseId: exerciseLog.exerciseId,
  label: exerciseLog.label,
  state: getCompletedExerciseProgressionState(exerciseLog),
});

export const buildProgressionSummary = (
  sessions: WorkoutSessionDto[]
): ProgressionSummary => {
  const summary: ProgressionSummary = {
    readyToProgress: [],
    repeatWeight: [],
    holdSteady: [],
    reduceOrModify: [],
  };

  for (const exerciseLog of getLatestCompletedExerciseLogs(sessions)) {
    const item = createSummaryItem(exerciseLog);

    if (item.state === "ready_to_increase") {
      summary.readyToProgress.push(item);
    } else if (item.state === "repeat_weight") {
      summary.repeatWeight.push(item);
    } else if (item.state === "hold_steady") {
      summary.holdSteady.push(item);
    } else {
      summary.reduceOrModify.push(item);
    }
  }

  return summary;
};
