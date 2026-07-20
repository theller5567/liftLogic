import { describe, expect, it } from "vitest";

import type {
  WorkoutExerciseLog,
  WorkoutSessionDto,
} from "../../../shared/types/workoutSession.types";
import {
  buildTrendsData,
  filterTrendSessionsForScope,
  formatTrendVolume,
} from "./trendsData";

const createExerciseLog = (
  overrides: Partial<WorkoutExerciseLog> = {}
): WorkoutExerciseLog => ({
  badgeIds: [],
  completed: true,
  exerciseId: "bench_press",
  label: "Bench Press",
  notes: undefined,
  plannedExerciseId: "bench_press",
  plannedLabel: "Bench Press",
  prescriptionSnapshot: {
    reps: "6-8",
    restSeconds: 120,
    sets: 3,
    suggestedWeight: 135,
    weightUnit: "lb",
  },
  sets: [
    {
      actualReps: 8,
      completed: true,
      setNumber: 1,
      targetReps: "6-8",
      weight: 135,
      weightUnit: "lb",
    },
    {
      actualReps: 8,
      completed: true,
      setNumber: 2,
      targetReps: "6-8",
      weight: 135,
      weightUnit: "lb",
    },
    {
      actualReps: 7,
      completed: true,
      setNumber: 3,
      targetReps: "6-8",
      weight: 135,
      weightUnit: "lb",
    },
  ],
  slotId: "slot-1",
  wasSubstituted: false,
  ...overrides,
});

const createSession = (
  overrides: Partial<WorkoutSessionDto> = {}
): WorkoutSessionDto =>
  ({
    _id: "session-1",
    badgeIds: [],
    clientId: "client-1",
    completedAt: new Date("2026-07-01T10:50:00").toISOString(),
    completedExerciseCount: 1,
    completionPercentage: 100,
    createdAt: new Date("2026-07-01T10:00:00").toISOString(),
    durationSeconds: 3000,
    exerciseLogs: [createExerciseLog()],
    programDayId: "day-1",
    programDayLabel: "Upper",
    programId: "program-1",
    scheduledDateKey: "2026-07-01",
    scheduledFor: new Date("2026-07-01T10:00:00").toISOString(),
    startedAt: new Date("2026-07-01T10:00:00").toISOString(),
    status: "completed",
    totalExerciseCount: 1,
    updatedAt: new Date("2026-07-01T11:00:00").toISOString(),
    workoutPlanId: "plan-1",
    workoutSnapshot: {
      exercises: [],
      focus: "Test",
      id: "day-1",
      label: "Upper",
    },
    ...overrides,
  }) as WorkoutSessionDto;

describe("trends data", () => {
  it("returns mock data when there are no completed sessions", () => {
    const trendsData = buildTrendsData([
      createSession({ status: "in_progress" }),
    ]);

    expect(trendsData.isMock).toBe(true);
    expect(trendsData.metrics[0].value).toBe("22");
  });

  it("builds live metrics from completed sessions", () => {
    const trendsData = buildTrendsData(
      [
        createSession(),
        createSession({
          _id: "session-2",
          completionPercentage: 80,
          durationSeconds: 2400,
          scheduledFor: new Date("2026-07-03T10:00:00").toISOString(),
        }),
      ],
      new Date("2026-07-11T12:00:00")
    );

    expect(trendsData.isMock).toBe(false);
    expect(trendsData.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Workouts", value: "2" }),
        expect.objectContaining({ label: "Completion", value: "90%" }),
        expect.objectContaining({ label: "Avg Duration", value: "45m" }),
      ])
    );
  });

  it("does not count soft-deleted sessions in live metrics", () => {
    const trendsData = buildTrendsData(
      [
        createSession(),
        createSession({
          _id: "session-deleted",
          deletedAt: new Date("2026-07-05T12:00:00").toISOString(),
        }),
      ],
      new Date("2026-07-11T12:00:00")
    );

    expect(trendsData.metrics).toContainEqual(
      expect.objectContaining({ label: "Workouts", value: "1" })
    );
  });

  it("ignores incomplete sets and sets missing weight or reps for volume", () => {
    const trendsData = buildTrendsData(
      [
        createSession({
          exerciseLogs: [
            createExerciseLog({
              sets: [
                {
                  actualReps: 10,
                  completed: true,
                  setNumber: 1,
                  weight: 100,
                  weightUnit: "lb",
                },
                {
                  actualReps: 10,
                  completed: false,
                  setNumber: 2,
                  weight: 100,
                  weightUnit: "lb",
                },
                {
                  completed: true,
                  setNumber: 3,
                  weight: 100,
                  weightUnit: "lb",
                },
              ],
            }),
          ],
        }),
      ],
      new Date("2026-07-11T12:00:00")
    );

    expect(trendsData.metrics).toContainEqual(
      expect.objectContaining({
        label: "Volume",
        value: "1k lb",
        detail: "2 sets • 10 reps",
      })
    );
  });

  it("groups weekly volume into the rolling eight-week window", () => {
    const trendsData = buildTrendsData(
      [
        createSession({
          scheduledFor: new Date("2026-07-01T10:00:00").toISOString(),
        }),
      ],
      new Date("2026-07-11T12:00:00")
    );
    const activeWeek = trendsData.weeklyVolume.find(
      (point) => point.workouts === 1
    );

    expect(trendsData.weeklyVolume).toHaveLength(8);
    expect(activeWeek?.volume).toBe(3105);
  });

  it("derives exercise top weight and latest change", () => {
    const trendsData = buildTrendsData(
      [
        createSession({
          scheduledFor: new Date("2026-07-01T10:00:00").toISOString(),
          exerciseLogs: [
            createExerciseLog({
              sets: [
                {
                  actualReps: 8,
                  completed: true,
                  setNumber: 1,
                  weight: 135,
                  weightUnit: "lb",
                },
              ],
            }),
          ],
        }),
        createSession({
          _id: "session-2",
          scheduledFor: new Date("2026-07-08T10:00:00").toISOString(),
          exerciseLogs: [
            createExerciseLog({
              sets: [
                {
                  actualReps: 8,
                  completed: true,
                  setNumber: 1,
                  weight: 145,
                  weightUnit: "lb",
                },
              ],
            }),
          ],
        }),
      ],
      new Date("2026-07-11T12:00:00")
    );

    expect(trendsData.exerciseTrends[0]).toEqual(
      expect.objectContaining({
        label: "Bench Press",
        topWeight: 145,
        changeLabel: "+10 lb",
      })
    );
  });

  it("formats trend volume compactly", () => {
    expect(formatTrendVolume(12500)).toBe("12.5k lb");
  });

  it("filters trend sessions to current program scope", () => {
    const currentSession = createSession({
      _id: "current-session",
      programHistoryId: "history-2",
      programId: "full_body_3_day",
      programVersion: 2,
    });
    const previousSession = createSession({
      _id: "previous-session",
      programHistoryId: "history-1",
      programId: "bro_split",
      programVersion: 1,
    });

    expect(
      filterTrendSessionsForScope(
        [previousSession, currentSession],
        "current_program",
        {
          activeProgramHistoryId: "history-2",
          programId: "full_body_3_day",
          programVersion: 2,
          workoutPlanId: "plan-1",
        }
      ).map((session) => session._id)
    ).toEqual(["current-session"]);
  });

  it("keeps archived but non-deleted sessions in all-time trend scope", () => {
    const currentSession = createSession({
      _id: "current-session",
      programHistoryId: "history-2",
      programId: "full_body_3_day",
      programVersion: 2,
    });
    const previousSession = createSession({
      _id: "previous-session",
      programHistoryId: "history-1",
      programId: "bro_split",
      programVersion: 1,
    });

    expect(
      filterTrendSessionsForScope(
        [previousSession, currentSession],
        "all_time"
      ).map((session) => session._id)
    ).toEqual(["previous-session", "current-session"]);
  });
});
