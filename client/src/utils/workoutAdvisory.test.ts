import { describe, expect, it } from "vitest";

import type {
  WorkoutBadgeId,
  WorkoutExerciseLog,
  WorkoutSessionDto,
} from "../../../shared/types/workoutSession.types";
import {
  getProgressiveOverloadRecommendation,
  shouldShowWeightIncreaseAdvisory,
} from "./workoutAdvisory";

const createExerciseLog = ({
  actualReps = [10, 10, 10],
  badgeIds = [],
  completed = true,
  exerciseId = "barbell_bench_press",
  label = "Bench Press",
  sets = 3,
  targetReps = "8-10",
  weight = 135,
}: {
  actualReps?: number[];
  badgeIds?: WorkoutBadgeId[];
  completed?: boolean;
  exerciseId?: string;
  label?: string;
  sets?: number;
  targetReps?: string;
  weight?: number;
} = {}): WorkoutExerciseLog => ({
  badgeIds,
  completed,
  exerciseId,
  label,
  notes: undefined,
  plannedExerciseId: exerciseId,
  plannedLabel: label,
  prescriptionSnapshot: {
    reps: targetReps,
    restSeconds: 120,
    sets,
    suggestedWeight: weight,
    weightUnit: "lb",
  },
  sets: Array.from({ length: sets }, (_, index) => ({
    actualReps: actualReps[index],
    completed: actualReps[index] !== undefined,
    setNumber: index + 1,
    targetReps,
    weight,
    weightUnit: "lb",
  })),
  slotId: `${exerciseId}-slot`,
  wasSubstituted: false,
});

const createSession = ({
  exerciseLog = createExerciseLog(),
  scheduledFor,
  status = "completed",
}: {
  exerciseLog?: WorkoutExerciseLog;
  scheduledFor: string;
  status?: WorkoutSessionDto["status"];
}): WorkoutSessionDto =>
  ({
    _id: `session-${scheduledFor}`,
    badgeIds: [],
    clientId: "user-1",
    completedAt: status === "completed" ? scheduledFor : null,
    completedExerciseCount: exerciseLog.completed ? 1 : 0,
    completionPercentage: exerciseLog.completed ? 100 : 0,
    createdAt: scheduledFor,
    exerciseLogs: [exerciseLog],
    programDayId: "day-1",
    programDayLabel: "Chest",
    programId: "program-1",
    scheduledDateKey: scheduledFor.slice(0, 10),
    scheduledFor,
    startedAt: scheduledFor,
    status,
    totalExerciseCount: 1,
    updatedAt: scheduledFor,
    workoutPlanId: "plan-1",
    workoutSnapshot: {
      exercises: [],
      focus: "Chest",
      id: "day-1",
      label: "Chest",
    },
  }) as WorkoutSessionDto;

const currentSession = createSession({
  exerciseLog: createExerciseLog({ actualReps: [] }),
  scheduledFor: "2026-07-15T12:00:00.000Z",
  status: "in_progress",
});

const getRecommendationFromPriorLog = (
  exerciseLog = createExerciseLog(),
  activeExerciseLog = currentSession.exerciseLogs[0]
) =>
  getProgressiveOverloadRecommendation({
    currentSession: {
      ...currentSession,
      exerciseLogs: [activeExerciseLog],
    },
    exerciseLog: activeExerciseLog,
    priorSessions: [
      createSession({
        exerciseLog,
        scheduledFor: "2026-07-07T12:00:00.000Z",
      }),
    ],
    weightStep: 5,
  });

describe("progressive overload recommendations", () => {
  it("recommends increasing when all target reps were completed", () => {
    const recommendation = getRecommendationFromPriorLog();

    expect(recommendation.state).toBe("ready_to_increase");
    expect(recommendation.canApplyWeight).toBe(true);
    expect(recommendation.previousWeight).toBe(135);
    expect(recommendation.recommendedWeight).toBe(140);
  });

  it("holds steady when reps were missed", () => {
    const recommendation = getRecommendationFromPriorLog(
      createExerciseLog({ actualReps: [10, 9, 10], badgeIds: ["missed_reps"] })
    );

    expect(recommendation.state).toBe("hold_steady");
    expect(recommendation.canApplyWeight).toBe(false);
  });

  it("repeats weight when the user marked the exercise as hard", () => {
    const recommendation = getRecommendationFromPriorLog(
      createExerciseLog({ badgeIds: ["felt_hard"] })
    );

    expect(recommendation.state).toBe("repeat_weight");
    expect(recommendation.canApplyWeight).toBe(false);
  });

  it("repeats weight when the user marked a form issue", () => {
    const recommendation = getRecommendationFromPriorLog(
      createExerciseLog({ badgeIds: ["form_issue"] })
    );

    expect(recommendation.state).toBe("repeat_weight");
    expect(recommendation.canApplyWeight).toBe(false);
  });

  it("recommends reducing or modifying when pain was logged", () => {
    const recommendation = getRecommendationFromPriorLog(
      createExerciseLog({ badgeIds: ["pain"] })
    );

    expect(recommendation.state).toBe("reduce_or_modify");
    expect(recommendation.canApplyWeight).toBe(false);
  });

  it("does not apply weight increases to bodyweight or unweighted logs", () => {
    const pushUpLog = createExerciseLog({
      exerciseId: "push_up",
      label: "Push-Up",
      weight: 0,
    });
    const recommendation = getRecommendationFromPriorLog(
      pushUpLog,
      pushUpLog
    );

    expect(recommendation.state).toBe("ready_to_increase");
    expect(recommendation.canApplyWeight).toBe(false);
    expect(recommendation.recommendedWeight).toBeUndefined();
  });
});

describe("weight increase advisory guardrail", () => {
  it("allows the earned increase when prior history completed the target", () => {
    const activeExerciseLog = createExerciseLog({
      actualReps: [],
      weight: 135,
    });

    expect(
      shouldShowWeightIncreaseAdvisory({
        currentSession: {
          ...currentSession,
          exerciseLogs: [activeExerciseLog],
        },
        exerciseLog: activeExerciseLog,
        nextWeight: 140,
        previousWeight: 135,
        priorSessions: [
          createSession({
            exerciseLog: createExerciseLog({ weight: 135 }),
            scheduledFor: "2026-07-07T12:00:00.000Z",
          }),
        ],
      })
    ).toBe(false);
  });

  it("warns when jumping again before completing the accepted recommendation", () => {
    const activeExerciseLog = createExerciseLog({
      actualReps: [],
      weight: 140,
    });

    expect(
      shouldShowWeightIncreaseAdvisory({
        currentSession: {
          ...currentSession,
          exerciseLogs: [activeExerciseLog],
        },
        exerciseLog: activeExerciseLog,
        nextWeight: 145,
        previousWeight: 140,
        priorSessions: [
          createSession({
            exerciseLog: createExerciseLog({ weight: 135 }),
            scheduledFor: "2026-07-07T12:00:00.000Z",
          }),
        ],
      })
    ).toBe(true);
  });
});
