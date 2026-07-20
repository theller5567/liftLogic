import { describe, expect, it } from "vitest";

import type {
  WorkoutExerciseLog,
  WorkoutSessionDto,
} from "../../../shared/types/workoutSession.types";
import { getPersonalRecordsForSession } from "./personalRecords";

const createExerciseLog = ({
  exerciseId = "barbell_bench_press",
  label = "Bench Press",
  reps = [10, 10, 10],
  weights = [135, 135, 135],
}: {
  exerciseId?: string;
  label?: string;
  reps?: number[];
  weights?: number[];
} = {}): WorkoutExerciseLog => ({
  badgeIds: [],
  completed: true,
  exerciseId,
  label,
  plannedExerciseId: exerciseId,
  plannedLabel: label,
  prescriptionSnapshot: {
    reps: "8-10",
    restSeconds: 120,
    sets: reps.length,
    suggestedWeight: weights[0],
    weightUnit: "lb",
  },
  sets: reps.map((actualReps, index) => ({
    actualReps,
    completed: true,
    setNumber: index + 1,
    targetReps: "8-10",
    weight: weights[index],
    weightUnit: "lb",
  })),
  slotId: `${exerciseId}-slot`,
  wasSubstituted: false,
});

const createSession = ({
  exerciseLog,
  id,
  scheduledFor,
}: {
  exerciseLog: WorkoutExerciseLog;
  id: string;
  scheduledFor: string;
}): WorkoutSessionDto =>
  ({
    _id: id,
    badgeIds: [],
    clientId: "user-1",
    completedAt: scheduledFor,
    completedExerciseCount: 1,
    completionPercentage: 100,
    createdAt: scheduledFor,
    exerciseLogs: [exerciseLog],
    programDayId: "day-1",
    programDayLabel: "Chest",
    programId: "program-1",
    scheduledDateKey: scheduledFor.slice(0, 10),
    scheduledFor,
    startedAt: scheduledFor,
    status: "completed",
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

describe("personal records", () => {
  it("detects a heaviest weight record", () => {
    const records = getPersonalRecordsForSession(
      [
        createSession({
          exerciseLog: createExerciseLog({ weights: [135, 135, 135] }),
          id: "prior",
          scheduledFor: "2026-07-01T12:00:00.000Z",
        }),
        createSession({
          exerciseLog: createExerciseLog({ weights: [140, 140, 140] }),
          id: "current",
          scheduledFor: "2026-07-08T12:00:00.000Z",
        }),
      ],
      "current"
    );

    expect(records.some((record) => record.type === "heaviest_weight")).toBe(
      true
    );
  });

  it("ignores soft-deleted prior sessions when detecting records", () => {
    const records = getPersonalRecordsForSession(
      [
        {
          ...createSession({
            exerciseLog: createExerciseLog({ weights: [225, 225, 225] }),
            id: "deleted-prior",
            scheduledFor: "2026-07-01T12:00:00.000Z",
          }),
          deletedAt: "2026-07-02T12:00:00.000Z",
        },
        createSession({
          exerciseLog: createExerciseLog({ weights: [140, 140, 140] }),
          id: "current",
          scheduledFor: "2026-07-08T12:00:00.000Z",
        }),
      ],
      "current"
    );

    expect(records).toEqual([]);
  });

  it("detects most reps at the same weight", () => {
    const records = getPersonalRecordsForSession(
      [
        createSession({
          exerciseLog: createExerciseLog({ reps: [8, 8, 8] }),
          id: "prior",
          scheduledFor: "2026-07-01T12:00:00.000Z",
        }),
        createSession({
          exerciseLog: createExerciseLog({ reps: [10, 9, 8] }),
          id: "current",
          scheduledFor: "2026-07-08T12:00:00.000Z",
        }),
      ],
      "current"
    );

    expect(records.some((record) => record.type === "most_reps_at_weight")).toBe(
      true
    );
  });

  it("detects highest exercise volume", () => {
    const records = getPersonalRecordsForSession(
      [
        createSession({
          exerciseLog: createExerciseLog({ reps: [8, 8, 8] }),
          id: "prior",
          scheduledFor: "2026-07-01T12:00:00.000Z",
        }),
        createSession({
          exerciseLog: createExerciseLog({ reps: [10, 10, 10] }),
          id: "current",
          scheduledFor: "2026-07-08T12:00:00.000Z",
        }),
      ],
      "current"
    );

    expect(
      records.some((record) => record.type === "highest_exercise_volume")
    ).toBe(true);
  });

  it("detects best estimated one-rep max", () => {
    const records = getPersonalRecordsForSession(
      [
        createSession({
          exerciseLog: createExerciseLog({ reps: [8, 8, 8], weights: [135, 135, 135] }),
          id: "prior",
          scheduledFor: "2026-07-01T12:00:00.000Z",
        }),
        createSession({
          exerciseLog: createExerciseLog({ reps: [8, 8, 8], weights: [145, 145, 145] }),
          id: "current",
          scheduledFor: "2026-07-08T12:00:00.000Z",
        }),
      ],
      "current"
    );

    expect(
      records.some((record) => record.type === "best_estimated_one_rep_max")
    ).toBe(true);
  });

  it("does not create records without prior completed history", () => {
    const records = getPersonalRecordsForSession(
      [
        createSession({
          exerciseLog: createExerciseLog(),
          id: "current",
          scheduledFor: "2026-07-08T12:00:00.000Z",
        }),
      ],
      "current"
    );

    expect(records).toEqual([]);
  });

  it("does not create user-facing records for isolation exercises", () => {
    const records = getPersonalRecordsForSession(
      [
        createSession({
          exerciseLog: createExerciseLog({
            exerciseId: "cable_curl",
            label: "Cable Curl",
            weights: [45, 45, 45],
          }),
          id: "prior",
          scheduledFor: "2026-07-01T12:00:00.000Z",
        }),
        createSession({
          exerciseLog: createExerciseLog({
            exerciseId: "cable_curl",
            label: "Cable Curl",
            weights: [50, 50, 50],
          }),
          id: "current",
          scheduledFor: "2026-07-08T12:00:00.000Z",
        }),
      ],
      "current"
    );

    expect(records).toEqual([]);
  });
});
