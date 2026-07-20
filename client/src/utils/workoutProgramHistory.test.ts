import { describe, expect, it } from "vitest";

import {
  createProgramHistoryEntry,
  getActiveProgramHistoryEntry,
  resetProgramHistoryForPreview,
  resolveProgramHistoryForPreview,
} from "../../../shared/utils/workoutProgramHistory";

const now = new Date("2026-07-20T12:00:00.000Z");
const firstPreview = {
  label: "Full Body 3-Day Routine",
  programId: "full_body_3_day",
};
const secondPreview = {
  label: "Upper / Lower Split",
  programId: "upper_lower_split",
};

describe("workout program history", () => {
  it("creates active program history entries with stable version ids", () => {
    expect(
      createProgramHistoryEntry({
        now,
        preview: firstPreview,
        programVersion: 1,
        switchReason: "onboarding",
        workoutPlanId: "plan-1",
      })
    ).toEqual({
      endedAt: null,
      id: "program-history-1",
      programId: "full_body_3_day",
      programLabel: "Full Body 3-Day Routine",
      programVersion: 1,
      startedAt: "2026-07-20T12:00:00.000Z",
      status: "active",
      switchReason: "onboarding",
      workoutPlanId: "plan-1",
    });
  });

  it("keeps the active history entry when the program has not changed", () => {
    const history = [
      createProgramHistoryEntry({
        now,
        preview: firstPreview,
        programVersion: 1,
        switchReason: "onboarding",
        workoutPlanId: "plan-1",
      }),
    ];

    expect(
      resolveProgramHistoryForPreview({
        activeProgramHistoryId: "program-history-1",
        history,
        now: new Date("2026-07-21T12:00:00.000Z"),
        preview: firstPreview,
        switchReason: "manual_switch",
        workoutPlanId: "plan-1",
      })
    ).toEqual({
      activeProgramHistoryId: "program-history-1",
      programHistory: history,
      programVersion: 1,
    });
  });

  it("archives the current entry and starts a new version when the program changes", () => {
    const history = [
      createProgramHistoryEntry({
        now,
        preview: firstPreview,
        programVersion: 1,
        switchReason: "onboarding",
        workoutPlanId: "plan-1",
      }),
    ];

    const result = resolveProgramHistoryForPreview({
      activeProgramHistoryId: "program-history-1",
      history,
      now: new Date("2026-07-27T12:00:00.000Z"),
      preview: secondPreview,
      switchReason: "manual_switch",
      workoutPlanId: "plan-1",
    });

    expect(result.activeProgramHistoryId).toBe("program-history-2");
    expect(result.programVersion).toBe(2);
    expect(result.programHistory).toEqual([
      {
        ...history[0],
        endedAt: "2026-07-27T12:00:00.000Z",
        status: "archived",
      },
      {
        endedAt: null,
        id: "program-history-2",
        programId: "upper_lower_split",
        programLabel: "Upper / Lower Split",
        programVersion: 2,
        startedAt: "2026-07-27T12:00:00.000Z",
        status: "active",
        switchReason: "manual_switch",
        workoutPlanId: "plan-1",
      },
    ]);
  });

  it("finds the active history entry by id when multiple entries exist", () => {
    const activeEntry = createProgramHistoryEntry({
      now,
      preview: secondPreview,
      programVersion: 2,
      switchReason: "manual_switch",
      workoutPlanId: "plan-1",
    });

    expect(
      getActiveProgramHistoryEntry(
        [
          {
            ...createProgramHistoryEntry({
              now,
              preview: firstPreview,
              programVersion: 1,
              switchReason: "onboarding",
              workoutPlanId: "plan-1",
            }),
            status: "archived",
          },
          activeEntry,
        ],
        "program-history-2"
      )
    ).toEqual(activeEntry);
  });

  it("archives the current program and starts a fresh version when progress is reset", () => {
    const history = [
      {
        ...createProgramHistoryEntry({
          now,
          preview: secondPreview,
          programVersion: 1,
          switchReason: "manual_switch",
          workoutPlanId: "plan-1",
        }),
        endedAt: "2026-07-19T12:00:00.000Z",
        status: "archived" as const,
      },
      createProgramHistoryEntry({
        now: new Date("2026-07-20T12:00:00.000Z"),
        preview: firstPreview,
        programVersion: 2,
        switchReason: "manual_switch",
        workoutPlanId: "plan-1",
      }),
    ];

    const result = resetProgramHistoryForPreview({
      activeProgramHistoryId: "program-history-2",
      history,
      now: new Date("2026-07-28T12:00:00.000Z"),
      preview: firstPreview,
      workoutPlanId: "plan-1",
    });

    expect(result.activeProgramHistoryId).toBe("program-history-3");
    expect(result.programVersion).toBe(3);
    expect(result.programHistory).toEqual([
      history[0],
      {
        ...history[1],
        endedAt: "2026-07-28T12:00:00.000Z",
        status: "archived",
      },
      {
        endedAt: null,
        id: "program-history-3",
        programId: "full_body_3_day",
        programLabel: "Full Body 3-Day Routine",
        programVersion: 3,
        startedAt: "2026-07-28T12:00:00.000Z",
        status: "active",
        switchReason: "reset",
        workoutPlanId: "plan-1",
      },
    ]);
  });
});
