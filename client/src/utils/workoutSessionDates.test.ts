import { describe, expect, it } from "vitest";

import type { WorkoutSessionDto } from "../../../shared/types/workoutSession.types";
import {
  findWorkoutSessionForDate,
  getDateKey,
  getEndOfWeek,
  getStartOfWeek,
  isSameDate,
} from "./workoutSessionDates";

const createSession = (
  overrides: Partial<WorkoutSessionDto> = {}
): WorkoutSessionDto =>
  ({
    _id: "session-1",
    badgeIds: [],
    clientId: "client-1",
    completedExerciseCount: 0,
    completionPercentage: 0,
    createdAt: new Date(0).toISOString(),
    exerciseLogs: [],
    programDayId: "day-1",
    programDayLabel: "Day 1",
    programId: "program-1",
    scheduledDateKey: "2026-07-10",
    scheduledFor: new Date("2026-07-10T12:00:00").toISOString(),
    startedAt: new Date("2026-07-10T12:00:00").toISOString(),
    status: "in_progress",
    totalExerciseCount: 0,
    updatedAt: new Date(0).toISOString(),
    workoutPlanId: "plan-1",
    workoutSnapshot: {
      exercises: [],
      focus: "Test",
      id: "day-1",
      label: "Day 1",
    },
    ...overrides,
  }) as WorkoutSessionDto;

describe("workout session dates", () => {
  it("starts the week on Monday and ends it on Sunday", () => {
    const date = new Date("2026-07-11T14:30:00");

    expect(getDateKey(getStartOfWeek(date))).toBe("2026-07-06");
    expect(getDateKey(getEndOfWeek(date))).toBe("2026-07-12");
    expect(getEndOfWeek(date).getHours()).toBe(23);
  });

  it("handles Sunday by returning the previous Monday", () => {
    const sunday = new Date("2026-07-12T10:00:00");

    expect(getDateKey(getStartOfWeek(sunday))).toBe("2026-07-06");
  });

  it("formats local date keys with padded month and day", () => {
    expect(getDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("compares dates without requiring matching times", () => {
    expect(
      isSameDate(
        new Date("2026-07-10T08:00:00"),
        new Date("2026-07-10T22:00:00")
      )
    ).toBe(true);
  });

  it("finds the most recent matching session by date, program day, and status", () => {
    const selectedDate = new Date("2026-07-10T09:00:00");
    const olderMatch = createSession({
      _id: "older",
      startedAt: new Date("2026-07-10T08:00:00").toISOString(),
    });
    const newerMatch = createSession({
      _id: "newer",
      startedAt: new Date("2026-07-10T12:00:00").toISOString(),
    });
    const wrongStatus = createSession({
      _id: "completed",
      status: "completed",
      startedAt: new Date("2026-07-10T14:00:00").toISOString(),
    });
    const wrongDay = createSession({
      _id: "wrong-day",
      programDayId: "day-2",
      startedAt: new Date("2026-07-10T16:00:00").toISOString(),
    });

    expect(
      findWorkoutSessionForDate(
        [olderMatch, wrongStatus, wrongDay, newerMatch],
        selectedDate,
        "day-1",
        "in_progress"
      )?._id
    ).toBe("newer");
  });
});
