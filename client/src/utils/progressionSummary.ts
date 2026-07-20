import type {
  WorkoutExerciseLog,
  WorkoutSessionDto,
} from "../../../shared/types/workoutSession.types";
import {
  filterExerciseHistoryWorkoutSessions,
  type ExerciseHistoryScopeOptions,
} from "../../../shared/utils/workoutSessionScope";
import {
  getCompletedExerciseProgressionState,
  type ActionableProgressiveOverloadState,
} from "./workoutAdvisory";

export type ProgressionSummaryItem = {
  exerciseId: string;
  historySource?: "current_program" | "previous_program";
  label: string;
  state: ActionableProgressiveOverloadState;
};

export type ProgressionSummary = {
  readyToProgress: ProgressionSummaryItem[];
  repeatWeight: ProgressionSummaryItem[];
  holdSteady: ProgressionSummaryItem[];
  reduceOrModify: ProgressionSummaryItem[];
};

const getLatestCompletedExerciseLogs = (
  sessions: WorkoutSessionDto[],
  exerciseHistoryScope: ExerciseHistoryScopeOptions = {}
) => {
  const latestExerciseLogs = new Map<
    string,
    {
      exerciseLog: WorkoutExerciseLog;
      historySource?: ProgressionSummaryItem["historySource"];
      time: number;
    }
  >();

  for (const session of filterExerciseHistoryWorkoutSessions(
    sessions,
    exerciseHistoryScope
  )) {
    if (session.status !== "completed") {
      continue;
    }

    const sessionTime = new Date(session.scheduledFor).getTime();

    for (const exerciseLog of session.exerciseLogs) {
      const resetCutoff = exerciseHistoryScope.resetCutoffs?.[exerciseLog.exerciseId];

      if (resetCutoff && sessionTime <= new Date(resetCutoff).getTime()) {
        continue;
      }

      const current = latestExerciseLogs.get(exerciseLog.exerciseId);

      if (!current || sessionTime > current.time) {
        latestExerciseLogs.set(exerciseLog.exerciseId, {
          exerciseLog,
          historySource:
            exerciseHistoryScope.currentProgramScope &&
            !filterExerciseHistoryWorkoutSessions([session], {
              ...exerciseHistoryScope,
              includePreviousPrograms: false,
            }).length
              ? "previous_program"
              : exerciseHistoryScope.currentProgramScope
                ? "current_program"
                : undefined,
          time: sessionTime,
        });
      }
    }
  }

  return [...latestExerciseLogs.values()];
};

const createSummaryItem = (
  exerciseLog: WorkoutExerciseLog,
  historySource?: ProgressionSummaryItem["historySource"]
): ProgressionSummaryItem => ({
  exerciseId: exerciseLog.exerciseId,
  historySource,
  label: exerciseLog.label,
  state: getCompletedExerciseProgressionState(exerciseLog),
});

export const buildProgressionSummary = (
  sessions: WorkoutSessionDto[],
  exerciseHistoryScope: ExerciseHistoryScopeOptions = {}
): ProgressionSummary => {
  const summary: ProgressionSummary = {
    readyToProgress: [],
    repeatWeight: [],
    holdSteady: [],
    reduceOrModify: [],
  };

  for (const { exerciseLog, historySource } of getLatestCompletedExerciseLogs(
    sessions,
    exerciseHistoryScope
  )) {
    const item = createSummaryItem(exerciseLog, historySource);

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
