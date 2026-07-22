import { describe, expect, it } from "vitest";

import type {
  WorkoutBadgeId,
  WorkoutExerciseLog,
  WorkoutSessionDto,
} from "../../../shared/types/workoutSession.types";
import {
  getProgressiveOverloadRecommendation,
  hasLoadTooHighSignal,
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
  programHistoryId,
  programId = "program-1",
  programVersion,
  scheduledFor,
  status = "completed",
  workoutPlanId = "plan-1",
}: {
  exerciseLog?: WorkoutExerciseLog;
  programHistoryId?: string;
  programId?: string;
  programVersion?: number;
  scheduledFor: string;
  status?: WorkoutSessionDto["status"];
  workoutPlanId?: string;
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
    programHistoryId,
    programDayId: "day-1",
    programDayLabel: "Chest",
    programId,
    programVersion,
    scheduledDateKey: scheduledFor.slice(0, 10),
    scheduledFor,
    startedAt: scheduledFor,
    status,
    totalExerciseCount: 1,
    updatedAt: scheduledFor,
    workoutPlanId,
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

  it("keeps normal earned increases when they remain feasible", () => {
    const activeExerciseLog = createExerciseLog({
      actualReps: [],
      weight: 135,
    });
    const recommendation = getProgressiveOverloadRecommendation({
      currentSession: {
        ...currentSession,
        exerciseLogs: [activeExerciseLog],
      },
      exerciseLog: activeExerciseLog,
      priorSessions: [
        createSession({
          exerciseLog: createExerciseLog({ actualReps: [10, 10, 10], weight: 135 }),
          scheduledFor: "2026-07-07T12:00:00.000Z",
        }),
      ],
      weightStep: 5,
    });

    expect(recommendation.state).toBe("ready_to_increase");
    expect(recommendation.canApplyWeight).toBe(true);
    expect(recommendation.recommendedWeight).toBe(140);
  });

  it("shrinks oversized earned increases when a smaller jump is feasible", () => {
    const activeExerciseLog = createExerciseLog({
      actualReps: [],
      weight: 100,
    });
    const recommendation = getProgressiveOverloadRecommendation({
      currentSession: {
        ...currentSession,
        exerciseLogs: [activeExerciseLog],
      },
      exerciseLog: activeExerciseLog,
      priorSessions: [
        createSession({
          exerciseLog: createExerciseLog({ actualReps: [10, 10, 10], weight: 100 }),
          scheduledFor: "2026-07-07T12:00:00.000Z",
        }),
      ],
      weightStep: 20,
    });

    expect(recommendation.state).toBe("ready_to_increase");
    expect(recommendation.canApplyWeight).toBe(true);
    expect(recommendation.recommendedWeight).toBe(105);
    expect(recommendation.reason).toContain("smaller increase");
  });

  it("turns too-heavy earned increases into a repeat recommendation", () => {
    const activeExerciseLog = createExerciseLog({
      actualReps: [],
      weight: 100,
    });
    const recommendation = getProgressiveOverloadRecommendation({
      currentSession: {
        ...currentSession,
        exerciseLogs: [activeExerciseLog],
      },
      exerciseLog: activeExerciseLog,
      priorSessions: [
        createSession({
          exerciseLog: createExerciseLog({ actualReps: [10, 10, 10], weight: 100 }),
          scheduledFor: "2026-07-07T12:00:00.000Z",
        }),
      ],
      weightStep: 80,
    });

    expect(recommendation.state).toBe("repeat_weight");
    expect(recommendation.canApplyWeight).toBe(false);
    expect(recommendation.recommendedWeight).toBe(100);
    expect(recommendation.reason).toContain("looks too heavy");
  });

  it("does not reduce after a jump when all sets stay within the rep range", () => {
    const activeExerciseLog = createExerciseLog({
      actualReps: [],
      targetReps: "8-12",
      weight: 140,
    });
    const recommendation = getProgressiveOverloadRecommendation({
      currentSession: {
        ...currentSession,
        exerciseLogs: [activeExerciseLog],
        scheduledFor: "2026-07-15T12:00:00.000Z",
      },
      exerciseLog: activeExerciseLog,
      priorSessions: [
        createSession({
          exerciseLog: createExerciseLog({
            actualReps: [12, 8, 8],
            targetReps: "8-12",
            weight: 135,
          }),
          scheduledFor: "2026-07-01T12:00:00.000Z",
        }),
        createSession({
          exerciseLog: createExerciseLog({
            actualReps: [12, 8, 8],
            targetReps: "8-12",
            weight: 140,
          }),
          scheduledFor: "2026-07-08T12:00:00.000Z",
        }),
      ],
      weightStep: 5,
    });

    expect(recommendation.state).toBe("hold_steady");
    expect(recommendation.canApplyWeight).toBe(false);
  });

  it("recommends returning to the previous load after a premature below-range jump", () => {
    const activeExerciseLog = createExerciseLog({
      actualReps: [],
      targetReps: "8-12",
      weight: 140,
    });
    const recommendation = getProgressiveOverloadRecommendation({
      currentSession: {
        ...currentSession,
        exerciseLogs: [activeExerciseLog],
        scheduledFor: "2026-07-15T12:00:00.000Z",
      },
      exerciseLog: activeExerciseLog,
      priorSessions: [
        createSession({
          exerciseLog: createExerciseLog({
            actualReps: [12, 8, 8],
            targetReps: "8-12",
            weight: 135,
          }),
          scheduledFor: "2026-07-01T12:00:00.000Z",
        }),
        createSession({
          exerciseLog: createExerciseLog({
            actualReps: [12, 7, 6],
            targetReps: "8-12",
            weight: 140,
          }),
          scheduledFor: "2026-07-08T12:00:00.000Z",
        }),
      ],
      weightStep: 5,
    });

    expect(recommendation.state).toBe("reduce_or_modify");
    expect(recommendation.canApplyWeight).toBe(true);
    expect(recommendation.recommendedWeight).toBe(135);
  });

  it("does not reduce after a jump when strong early sets fade only at the end", () => {
    const activeExerciseLog = createExerciseLog({
      actualReps: [],
      targetReps: "8-12",
      weight: 140,
    });
    const recommendation = getProgressiveOverloadRecommendation({
      currentSession: {
        ...currentSession,
        exerciseLogs: [activeExerciseLog],
        scheduledFor: "2026-07-15T12:00:00.000Z",
      },
      exerciseLog: activeExerciseLog,
      priorSessions: [
        createSession({
          exerciseLog: createExerciseLog({
            actualReps: [12, 12, 12],
            targetReps: "8-12",
            weight: 135,
          }),
          scheduledFor: "2026-07-01T12:00:00.000Z",
        }),
        createSession({
          exerciseLog: createExerciseLog({
            actualReps: [12, 12, 3],
            badgeIds: ["missed_reps"],
            targetReps: "8-12",
            weight: 140,
          }),
          scheduledFor: "2026-07-08T12:00:00.000Z",
        }),
      ],
      weightStep: 5,
    });

    expect(recommendation.state).toBe("hold_steady");
    expect(recommendation.canApplyWeight).toBe(false);
  });

  it("ignores soft-deleted prior sessions when building recommendations", () => {
    const activeExerciseLog = currentSession.exerciseLogs[0];
    const recommendation = getProgressiveOverloadRecommendation({
      currentSession,
      exerciseLog: activeExerciseLog,
      priorSessions: [
        {
          ...createSession({
            exerciseLog: createExerciseLog(),
            scheduledFor: "2026-07-07T12:00:00.000Z",
          }),
          deletedAt: "2026-07-08T12:00:00.000Z",
        },
      ],
      weightStep: 5,
    });

    expect(recommendation.state).toBe("no_history");
  });

  it("holds steady when reps were missed", () => {
    const recommendation = getRecommendationFromPriorLog(
      createExerciseLog({ actualReps: [10, 9, 10], badgeIds: ["missed_reps"] })
    );

    expect(recommendation.state).toBe("hold_steady");
    expect(recommendation.canApplyWeight).toBe(false);
  });

  it("recommends reducing weight when multiple sets badly miss the target", () => {
    const recommendation = getRecommendationFromPriorLog(
      createExerciseLog({ actualReps: [6, 6, 5] })
    );

    expect(recommendation.state).toBe("reduce_or_modify");
    expect(recommendation.canApplyWeight).toBe(true);
    expect(recommendation.previousWeight).toBe(135);
    expect(recommendation.recommendedWeight).toBe(130);
    expect(recommendation.reason).toContain("too high");
  });

  it("holds steady when missed reps are paired with hard effort but not severe", () => {
    const recommendation = getRecommendationFromPriorLog(
      createExerciseLog({
        actualReps: [10, 9, 8],
        badgeIds: ["missed_reps", "felt_hard"],
      })
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
    expect(recommendation.recommendedWeight).toBeUndefined();
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

  it("ignores previous-program history when the user opts out", () => {
    const activeExerciseLog = currentSession.exerciseLogs[0];
    const recommendation = getProgressiveOverloadRecommendation({
      currentSession: {
        ...currentSession,
        programHistoryId: "history-2",
        programId: "full_body_3_day",
        programVersion: 2,
      },
      exerciseHistoryScope: {
        currentProgramScope: {
          activeProgramHistoryId: "history-2",
          programId: "full_body_3_day",
          programVersion: 2,
          workoutPlanId: "plan-1",
        },
        includePreviousPrograms: false,
      },
      exerciseLog: activeExerciseLog,
      priorSessions: [
        createSession({
          exerciseLog: createExerciseLog(),
          programHistoryId: "history-1",
          programId: "bro_split",
          programVersion: 1,
          scheduledFor: "2026-07-07T12:00:00.000Z",
        }),
      ],
      weightStep: 5,
    });

    expect(recommendation.state).toBe("no_history");
  });

  it("labels recommendations that use prior-program exercise history", () => {
    const activeExerciseLog = currentSession.exerciseLogs[0];
    const recommendation = getProgressiveOverloadRecommendation({
      currentSession: {
        ...currentSession,
        programHistoryId: "history-2",
        programId: "full_body_3_day",
        programVersion: 2,
      },
      exerciseHistoryScope: {
        currentProgramScope: {
          activeProgramHistoryId: "history-2",
          programId: "full_body_3_day",
          programVersion: 2,
          workoutPlanId: "plan-1",
        },
        includePreviousPrograms: true,
      },
      exerciseLog: activeExerciseLog,
      priorSessions: [
        createSession({
          exerciseLog: createExerciseLog(),
          programHistoryId: "history-1",
          programId: "bro_split",
          programVersion: 1,
          scheduledFor: "2026-07-07T12:00:00.000Z",
        }),
      ],
      weightStep: 5,
    });

    expect(recommendation.state).toBe("ready_to_increase");
    expect(recommendation.historySource).toBe("previous_program");
  });

  it("ignores exercise logs before a reset cutoff", () => {
    const activeExerciseLog = currentSession.exerciseLogs[0];
    const recommendation = getProgressiveOverloadRecommendation({
      currentSession,
      exerciseHistoryScope: {
        resetCutoffs: {
          barbell_bench_press: "2026-07-10T12:00:00.000Z",
        },
      },
      exerciseLog: activeExerciseLog,
      priorSessions: [
        createSession({
          exerciseLog: createExerciseLog(),
          scheduledFor: "2026-07-07T12:00:00.000Z",
        }),
      ],
      weightStep: 5,
    });

    expect(recommendation.state).toBe("no_history");
  });
});

describe("load too high signals", () => {
  it("does not treat one small missed set as too heavy", () => {
    expect(
      hasLoadTooHighSignal(
        createExerciseLog({
          actualReps: [10, 9, 10],
          badgeIds: ["missed_reps"],
        })
      )
    ).toBe(false);
  });

  it("does not treat normal range fatigue as too heavy", () => {
    expect(
      hasLoadTooHighSignal(
        createExerciseLog({
          actualReps: [12, 9, 6],
          badgeIds: ["missed_reps"],
          targetReps: "8-12",
        })
      )
    ).toBe(false);
  });

  it("does not treat a small final-set miss below the range as too heavy", () => {
    expect(
      hasLoadTooHighSignal(
        createExerciseLog({
          actualReps: [8, 8, 7],
          badgeIds: ["missed_reps"],
          targetReps: "8-12",
        })
      )
    ).toBe(false);
  });

  it("allows one strong set with late fatigue before calling the load too heavy", () => {
    expect(
      hasLoadTooHighSignal(
        createExerciseLog({
          actualReps: [12, 8, 5],
          badgeIds: ["missed_reps"],
          targetReps: "8-12",
        })
      )
    ).toBe(false);
  });

  it("treats large repeated rep misses as too heavy", () => {
    expect(
      hasLoadTooHighSignal(
        createExerciseLog({
          actualReps: [6, 6, 5],
        })
      )
    ).toBe(true);
  });

  it("treats no sets reaching the minimum range as too heavy", () => {
    expect(
      hasLoadTooHighSignal(
        createExerciseLog({
          actualReps: [6, 5, 4],
          targetReps: "8-12",
        })
      )
    ).toBe(true);
  });

  it("treats one good set followed by severe misses as too heavy", () => {
    expect(
      hasLoadTooHighSignal(
        createExerciseLog({
          actualReps: [12, 5, 4],
          targetReps: "8-12",
        })
      )
    ).toBe(true);

    expect(
      hasLoadTooHighSignal(
        createExerciseLog({
          actualReps: [8, 4, 4],
          targetReps: "8-12",
        })
      )
    ).toBe(true);
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
