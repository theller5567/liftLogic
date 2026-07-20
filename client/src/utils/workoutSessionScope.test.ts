import { describe, expect, it } from "vitest";

import {
  filterActiveWorkoutSessions,
  filterCurrentProgramWorkoutSessions,
  isDeletedWorkoutSession,
  isWorkoutSessionInCurrentProgram,
} from "../../../shared/utils/workoutSessionScope";

describe("workout session scope helpers", () => {
  it("identifies soft-deleted workout sessions", () => {
    expect(isDeletedWorkoutSession({ deletedAt: null })).toBe(false);
    expect(isDeletedWorkoutSession({})).toBe(false);
    expect(
      isDeletedWorkoutSession({ deletedAt: "2026-07-20T12:00:00.000Z" })
    ).toBe(true);
  });

  it("filters deleted sessions out of active session lists", () => {
    const activeSession = { _id: "active", deletedAt: null };
    const deletedSession = {
      _id: "deleted",
      deletedAt: "2026-07-20T12:00:00.000Z",
    };

    expect(filterActiveWorkoutSessions([activeSession, deletedSession])).toEqual([
      activeSession,
    ]);
  });

  it("filters sessions to the active program history after a program switch", () => {
    const currentSession = {
      _id: "current-3-day",
      deletedAt: null,
      programHistoryId: "history-2",
      programId: "full_body_3_day",
      programVersion: 2,
      workoutPlanId: "plan-1",
    };
    const archivedSession = {
      _id: "archived-5-day",
      deletedAt: null,
      programHistoryId: "history-1",
      programId: "bro_split",
      programVersion: 1,
      workoutPlanId: "plan-1",
    };

    expect(
      filterCurrentProgramWorkoutSessions([archivedSession, currentSession], {
        activeProgramHistoryId: "history-2",
        programId: "full_body_3_day",
        programVersion: 2,
        workoutPlanId: "plan-1",
      })
    ).toEqual([currentSession]);
  });

  it("falls back to program id for pre-history sessions on the same plan", () => {
    const session = {
      _id: "pre-history-current-program",
      deletedAt: null,
      programId: "full_body_3_day",
      workoutPlanId: "plan-1",
    };

    expect(
      isWorkoutSessionInCurrentProgram(session, {
        activeProgramHistoryId: "history-2",
        programId: "full_body_3_day",
        programVersion: 2,
        workoutPlanId: "plan-1",
      })
    ).toBe(true);
  });

  it("does not match pre-history sessions from a different program", () => {
    const session = {
      _id: "pre-history-old-program",
      deletedAt: null,
      programId: "bro_split",
      workoutPlanId: "plan-1",
    };

    expect(
      isWorkoutSessionInCurrentProgram(session, {
        activeProgramHistoryId: "history-2",
        programId: "full_body_3_day",
        programVersion: 2,
        workoutPlanId: "plan-1",
      })
    ).toBe(false);
  });
});
