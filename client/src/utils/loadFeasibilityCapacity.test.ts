import { describe, expect, it } from "vitest";

import type { OnboardingAnswers } from "../../../shared/types/onboarding.types";
import type {
  WorkoutExerciseLog,
  WorkoutSessionDto,
} from "../../../shared/types/workoutSession.types";
import { resolveLoadFeasibilityCapacity } from "../../../shared/utils/loadFeasibilityCapacity";

const onboardingAnswers: OnboardingAnswers = {
  benchPress: {
    confidence: "medium",
    estimatedReps: 6,
    estimatedWeight: 210,
    knowsWorkingWeight: true,
  },
  experienceLevel: "intermediate",
  weightUnit: "lb",
};

const createExerciseLog = ({
  actualReps = 8,
  badgeIds = [],
  completed = true,
  exerciseId = "barbell_bench_press",
  weight = 185,
}: {
  actualReps?: number;
  badgeIds?: WorkoutExerciseLog["badgeIds"];
  completed?: boolean;
  exerciseId?: string;
  weight?: number;
} = {}): WorkoutExerciseLog => ({
  badgeIds,
  completed,
  exerciseId,
  label: "Bench Press",
  notes: undefined,
  plannedExerciseId: exerciseId,
  plannedLabel: "Bench Press",
  prescriptionSnapshot: {
    reps: "8-12",
    restSeconds: 120,
    sets: 4,
    suggestedWeight: weight,
    weightUnit: "lb",
  },
  sets: [
    {
      actualReps,
      completed: actualReps > 0,
      setNumber: 1,
      targetReps: "8-12",
      weight,
      weightUnit: "lb",
    },
  ],
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

describe("resolveLoadFeasibilityCapacity", () => {
  it("prefers recent clean performance over onboarding answers", () => {
    const result = resolveLoadFeasibilityCapacity({
      exerciseId: "barbell_bench_press",
      onboardingAnswers,
      workoutSessions: [
        createSession({
          exerciseLog: createExerciseLog({ actualReps: 8, weight: 185 }),
          scheduledFor: "2026-07-20T12:00:00.000Z",
        }),
      ],
    });

    expect(result.source).toBe("recent_performance");
    expect(result.sourceKind).toBe("recent_clean_log");
    expect(result.confidence).toBe("high");
    expect(result.capacity).toEqual(
      expect.objectContaining({
        oneRepMax: expect.closeTo(234.33, 2),
      })
    );
  });

  it("uses direct onboarding anchors when no clean history exists", () => {
    const result = resolveLoadFeasibilityCapacity({
      canonicalEstimatorKey: "bench_press",
      onboardingAnswers,
    });

    expect(result.source).toBe("onboarding");
    expect(result.sourceKind).toBe("onboarding_anchor");
    expect(result.confidence).toBe("medium");
    expect(result.capacity).toEqual({
      reps: 6,
      source: "onboarding",
      weight: 210,
    });
  });

  it("uses derived onboarding anchors for related exercises", () => {
    const result = resolveLoadFeasibilityCapacity({
      canonicalEstimatorKey: "dumbbell_bench_press",
      onboardingAnswers,
    });

    expect(result.source).toBe("onboarding");
    expect(result.sourceKind).toBe("derived_onboarding_anchor");
    expect(result.derivedFrom).toBe("bench_press");
    expect(result.capacity).toEqual({
      reps: 6,
      source: "onboarding",
      weight: 84,
    });
  });

  it("ignores incomplete or form-issue logs before using onboarding", () => {
    const result = resolveLoadFeasibilityCapacity({
      exerciseId: "barbell_bench_press",
      onboardingAnswers,
      workoutSessions: [
        createSession({
          exerciseLog: createExerciseLog({
            actualReps: 8,
            badgeIds: ["form_issue"],
            weight: 185,
          }),
          scheduledFor: "2026-07-20T12:00:00.000Z",
        }),
        createSession({
          exerciseLog: createExerciseLog({
            actualReps: 0,
            completed: false,
            weight: 185,
          }),
          scheduledFor: "2026-07-19T12:00:00.000Z",
        }),
      ],
    });

    expect(result.sourceKind).toBe("onboarding_anchor");
  });

  it("falls back to default capacity when no user source exists", () => {
    const result = resolveLoadFeasibilityCapacity({
      canonicalEstimatorKey: "bench_press",
      experienceLevel: "intermediate",
      weightUnit: "lb",
    });

    expect(result.source).toBe("default");
    expect(result.sourceKind).toBe("default_estimate");
    expect(result.confidence).toBe("low");
    expect(result.capacity).toEqual({
      reps: 10,
      source: "default",
      weight: 75,
    });
  });

  it("returns unknown when default fallback is disabled", () => {
    const result = resolveLoadFeasibilityCapacity({
      canonicalEstimatorKey: "bench_press",
      includeDefaultEstimate: false,
    });

    expect(result.source).toBe("unknown");
    expect(result.sourceKind).toBe("unknown");
    expect(result.capacity).toBeUndefined();
  });
});
