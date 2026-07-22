import { describe, expect, it } from "vitest";

import type {
  WorkoutBadgeId,
  WorkoutExerciseLog,
  WorkoutSessionDto,
} from "../../../shared/types/workoutSession.types";
import { buildProgressionSummary } from "./progressionSummary";

const createExerciseLog = ({
  actualReps = [10, 10, 10],
  badgeIds = [],
  exerciseId = "barbell_bench_press",
  label = "Bench Press",
  targetReps = "8-10",
  weight = 135,
}: {
  actualReps?: number[];
  badgeIds?: WorkoutBadgeId[];
  exerciseId?: string;
  label?: string;
  targetReps?: string;
  weight?: number;
} = {}): WorkoutExerciseLog => ({
  badgeIds,
  completed: actualReps.length === 3,
  exerciseId,
  label,
  notes: undefined,
  plannedExerciseId: exerciseId,
  plannedLabel: label,
  prescriptionSnapshot: {
    reps: targetReps,
    restSeconds: 120,
    sets: 3,
    suggestedWeight: weight,
    weightUnit: "lb",
  },
  sets: Array.from({ length: 3 }, (_, index) => ({
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
  exerciseLogs,
  scheduledFor = "2026-07-07T12:00:00.000Z",
}: {
  exerciseLogs: WorkoutExerciseLog[];
  scheduledFor?: string;
}): WorkoutSessionDto =>
  ({
    _id: `session-${scheduledFor}`,
    badgeIds: [],
    clientId: "user-1",
    completedAt: scheduledFor,
    completedExerciseCount: exerciseLogs.filter((log) => log.completed).length,
    completionPercentage: 100,
    createdAt: scheduledFor,
    exerciseLogs,
    programDayId: "day-1",
    programDayLabel: "Chest",
    programId: "program-1",
    scheduledDateKey: scheduledFor.slice(0, 10),
    scheduledFor,
    startedAt: scheduledFor,
    status: "completed",
    totalExerciseCount: exerciseLogs.length,
    updatedAt: scheduledFor,
    workoutPlanId: "plan-1",
    workoutSnapshot: {
      exercises: [],
      focus: "Chest",
      id: "day-1",
      label: "Chest",
    },
  }) as WorkoutSessionDto;

describe("progression summary", () => {
  it("groups latest completed exercises by progression signal", () => {
    const summary = buildProgressionSummary([
      createSession({
        exerciseLogs: [
          createExerciseLog(),
          createExerciseLog({
            badgeIds: ["felt_hard"],
            exerciseId: "barbell_row",
            label: "Barbell Row",
          }),
          createExerciseLog({
            actualReps: [10, 9, 10],
            exerciseId: "lat_pulldown",
            label: "Lat Pulldown",
          }),
          createExerciseLog({
            badgeIds: ["pain"],
            exerciseId: "back_squat",
            label: "Back Squat",
          }),
        ],
      }),
    ]);

    expect(summary.readyToProgress).toHaveLength(1);
    expect(summary.repeatWeight).toHaveLength(1);
    expect(summary.holdSteady).toHaveLength(1);
    expect(summary.reduceOrModify).toHaveLength(1);
  });

  it("uses the latest completed log for each exercise", () => {
    const summary = buildProgressionSummary([
      createSession({
        scheduledFor: "2026-07-01T12:00:00.000Z",
        exerciseLogs: [createExerciseLog({ badgeIds: ["pain"] })],
      }),
      createSession({
        scheduledFor: "2026-07-08T12:00:00.000Z",
        exerciseLogs: [createExerciseLog()],
      }),
    ]);

    expect(summary.readyToProgress).toHaveLength(1);
    expect(summary.reduceOrModify).toHaveLength(0);
  });

  it("does not treat within-range load jumps as modify signals in summaries", () => {
    const summary = buildProgressionSummary([
      createSession({
        scheduledFor: "2026-07-01T12:00:00.000Z",
        exerciseLogs: [
          createExerciseLog({
            actualReps: [12, 8, 8],
            targetReps: "8-12",
            weight: 135,
          }),
        ],
      }),
      createSession({
        scheduledFor: "2026-07-08T12:00:00.000Z",
        exerciseLogs: [
          createExerciseLog({
            actualReps: [12, 8, 8],
            targetReps: "8-12",
            weight: 140,
          }),
        ],
      }),
    ]);

    expect(summary.reduceOrModify).toHaveLength(0);
    expect(summary.holdSteady).toHaveLength(1);
  });

  it("treats premature below-range load jumps as modify signals in summaries", () => {
    const summary = buildProgressionSummary([
      createSession({
        scheduledFor: "2026-07-01T12:00:00.000Z",
        exerciseLogs: [
          createExerciseLog({
            actualReps: [12, 8, 8],
            targetReps: "8-12",
            weight: 135,
          }),
        ],
      }),
      createSession({
        scheduledFor: "2026-07-08T12:00:00.000Z",
        exerciseLogs: [
          createExerciseLog({
            actualReps: [12, 7, 6],
            targetReps: "8-12",
            weight: 140,
          }),
        ],
      }),
    ]);

    expect(summary.reduceOrModify).toHaveLength(1);
    expect(summary.reduceOrModify[0].signal).toBe("load_too_high");
  });

  it("ignores exercise logs before an exercise reset cutoff", () => {
    const summary = buildProgressionSummary(
      [
        createSession({
          scheduledFor: "2026-07-01T12:00:00.000Z",
          exerciseLogs: [createExerciseLog()],
        }),
      ],
      {
        resetCutoffs: {
          barbell_bench_press: "2026-07-10T12:00:00.000Z",
        },
      }
    );

    expect(summary.readyToProgress).toHaveLength(0);
  });
});
