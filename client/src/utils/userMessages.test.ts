import { describe, expect, it } from "vitest";

import type {
  WorkoutBadgeId,
  WorkoutExerciseLog,
  WorkoutSessionDto,
} from "../../../shared/types/workoutSession.types";
import {
  DEFAULT_MESSAGE_PREFERENCES,
  type UserMessagePreferences,
} from "../../../shared/types/userSettings.types";
import type { GeneratedWorkoutPreview } from "./generateWorkoutPreview";
import {
  buildUserMessages,
  getPrimaryUserMessage,
  getSecondaryUserMessages,
  getUserMessagesForSurface,
  groupTrendUserMessages,
  sortUserMessages,
  type UserMessage,
} from "./userMessages";

const createExerciseLog = ({
  actualReps = [10, 10, 10],
  badgeIds = [],
  exerciseId = "barbell_bench_press",
  label = "Bench Press",
  weight = 135,
}: {
  actualReps?: number[];
  badgeIds?: WorkoutBadgeId[];
  exerciseId?: string;
  label?: string;
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
    reps: "8-10",
    restSeconds: 120,
    sets: 3,
    suggestedWeight: weight,
    weightUnit: "lb",
  },
  sets: Array.from({ length: 3 }, (_, index) => ({
    actualReps: actualReps[index],
    completed: actualReps[index] !== undefined,
    setNumber: index + 1,
    targetReps: "8-10",
    weight,
    weightUnit: "lb",
  })),
  slotId: `${exerciseId}-slot`,
  wasSubstituted: false,
});

const createSession = ({
  exerciseLogs = [createExerciseLog()],
  id = "session-1",
  label = "Chest",
  programHistoryId,
  programDayId,
  programId = "program-1",
  programVersion,
  scheduledFor = "2026-07-07T12:00:00.000Z",
  status = "completed",
  workoutPlanId = "plan-1",
}: {
  exerciseLogs?: WorkoutExerciseLog[];
  id?: string;
  label?: string;
  programHistoryId?: string;
  programDayId?: string;
  programId?: string;
  programVersion?: number;
  scheduledFor?: string;
  status?: WorkoutSessionDto["status"];
  workoutPlanId?: string;
} = {}): WorkoutSessionDto =>
  ({
    _id: id,
    badgeIds: [],
    clientId: "user-1",
    completedAt: status === "completed" ? scheduledFor : null,
    completedExerciseCount: exerciseLogs.filter((log) => log.completed).length,
    completionPercentage: status === "completed" ? 100 : 0,
    createdAt: scheduledFor,
    exerciseLogs,
    programHistoryId,
    programDayId: programDayId ?? `${label.toLowerCase()}-day`,
    programDayLabel: label,
    programId,
    programVersion,
    scheduledDateKey: scheduledFor.slice(0, 10),
    scheduledFor,
    startedAt: scheduledFor,
    status,
    totalExerciseCount: exerciseLogs.length,
    updatedAt: scheduledFor,
    workoutPlanId,
    workoutSnapshot: {
      exercises: [],
      focus: label,
      id: `${label.toLowerCase()}-day`,
      label,
    },
  }) as WorkoutSessionDto;

const createPreview = (dayIds: string[]): Pick<GeneratedWorkoutPreview, "days"> => ({
  days: dayIds.map((id) => ({
    exercises: [],
    focus: id,
    id,
    label: id,
  })),
});

type MessagePreferenceOverrides = Omit<
  Partial<UserMessagePreferences>,
  "categories" | "surfaces"
> & {
  categories?: Partial<UserMessagePreferences["categories"]>;
  surfaces?: Partial<UserMessagePreferences["surfaces"]>;
};

const createMessagePreferences = (
  overrides: MessagePreferenceOverrides = {}
): UserMessagePreferences => ({
  ...DEFAULT_MESSAGE_PREFERENCES,
  ...overrides,
  categories: {
    ...DEFAULT_MESSAGE_PREFERENCES.categories,
    ...overrides.categories,
  },
  surfaces: {
    ...DEFAULT_MESSAGE_PREFERENCES.surfaces,
    ...overrides.surfaces,
  },
});

const createCompletedPlannedSessions = (dayIds: string[]) =>
  dayIds.map((dayId, index) =>
    createSession({
      id: `session-${dayId}`,
      label: dayId,
      programDayId: dayId,
      scheduledFor: `2026-07-${String(index + 6).padStart(2, "0")}T12:00:00.000Z`,
    })
  );

describe("user messages", () => {
  it("sorts messages by priority before title", () => {
    const messages: UserMessage[] = [
      {
        body: "Useful later.",
        category: "education",
        id: "education",
        priority: 70,
        severity: "info",
        surfaces: ["dashboard"],
        title: "Education",
      },
      {
        body: "Important now.",
        category: "recovery",
        id: "recovery",
        priority: 10,
        severity: "warning",
        surfaces: ["dashboard"],
        title: "Recovery",
      },
      {
        body: "Also important.",
        category: "completion",
        id: "completion",
        priority: 30,
        severity: "success",
        surfaces: ["dashboard"],
        title: "Completion",
      },
    ];

    expect(sortUserMessages(messages).map((message) => message.id)).toEqual([
      "recovery",
      "completion",
      "education",
    ]);
  });

  it("groups Trends messages by latest workout insights and training patterns", () => {
    const messages: UserMessage[] = [
      {
        body: "Keep this signal in mind.",
        category: "recovery",
        id: "pattern",
        lifecycle: {
          dismissalPolicy: {
            cooldownHours: 24,
            returnWhenChanged: true,
          },
          scope: "training_pattern",
        },
        priority: 10,
        severity: "warning",
        surfaces: ["trends"],
        title: "Pattern",
      },
      {
        body: "Nice work.",
        category: "personal_record",
        id: "latest",
        lifecycle: {
          dismissalPolicy: {
            cooldownHours: 168,
            returnWhenChanged: true,
          },
          scope: "latest_workout",
        },
        priority: 20,
        severity: "success",
        surfaces: ["trends"],
        title: "Latest",
      },
      {
        body: "Go up next time.",
        category: "progressive_overload",
        id: "exercise-action",
        lifecycle: {
          dismissalPolicy: {
            cooldownHours: 168,
            returnWhenChanged: true,
          },
          scope: "exercise_action",
        },
        priority: 30,
        severity: "info",
        surfaces: ["trends"],
        title: "Exercise action",
      },
    ];

    expect(groupTrendUserMessages(messages)).toEqual([
      {
        id: "latest_workout_insights",
        label: "Latest workout insights",
        messages: [messages[1], messages[2]],
      },
      {
        id: "training_patterns",
        label: "Training patterns",
        messages: [messages[0]],
      },
    ]);
  });

  it("builds derived recovery and progression messages from completed workout data", () => {
    const messages = buildUserMessages({
      sessions: [
        createSession({
          exerciseLogs: [
            createExerciseLog({ badgeIds: ["pain"], label: "Overhead Press" }),
            createExerciseLog({
              exerciseId: "lat_pulldown",
              label: "Lat Pulldown",
            }),
          ],
        }),
      ],
    });

    expect(messages.map((message) => message.id)).toEqual([
      "recovery-pain-signal",
      "progression-ready",
    ]);
    expect(messages[0].category).toBe("recovery");
    expect(messages[0].body).toContain("Overhead Press");
  });

  it("adds lifecycle metadata to generated messages", () => {
    const session = createSession({
      exerciseLogs: [
        createExerciseLog({ badgeIds: ["pain"], label: "Overhead Press" }),
        createExerciseLog({ exerciseId: "seated_row", label: "Seated Row" }),
      ],
    });
    const messages = buildUserMessages({
      recentlyCompletedSessionId: session._id,
      sessions: [session],
    });

    expect(messages.length).toBeGreaterThan(0);
    expect(messages.every((message) => message.lifecycle)).toBe(true);
    expect(
      messages.find((message) => message.id === "recovery-pain-signal")
        ?.lifecycle
    ).toEqual(
      expect.objectContaining({
        dismissalPolicy: {
          cooldownHours: 24,
          returnWhenChanged: true,
        },
        scope: "training_pattern",
        sourceExerciseIds: ["barbell_bench_press"],
        stateKey: "pain_signal",
      })
    );
    expect(
      messages.find((message) => message.id === "workout-complete-session-1")
        ?.lifecycle
    ).toEqual(
      expect.objectContaining({
        scope: "latest_workout",
        sourceSessionId: "session-1",
        stateKey: "workout_complete",
      })
    );
  });

  it("does not build messages from soft-deleted sessions", () => {
    const messages = buildUserMessages({
      preview: createPreview(["day-1"]),
      sessions: [
        {
          ...createSession({
            exerciseLogs: [
              createExerciseLog({ badgeIds: ["pain"], label: "Overhead Press" }),
            ],
            programDayId: "day-1",
          }),
          deletedAt: "2026-07-20T12:00:00.000Z",
        },
      ],
    });

    expect(messages).toEqual([]);
  });

  it("adds a workout summary completion message for a just-completed session", () => {
    const session = createSession({ id: "session-2", label: "Back" });
    const messages = buildUserMessages({
      recentlyCompletedSessionId: session._id,
      sessions: [session],
    });

    expect(messages.some((message) => message.id === "workout-complete-session-2")).toBe(
      true
    );
    expect(getUserMessagesForSurface(messages, "workout_summary")[0].title).toBe(
      "Workout complete"
    );
  });

  it("adds workout summary progression messages after a completed workout", () => {
    const session = createSession({
      exerciseLogs: [
        createExerciseLog({
          exerciseId: "barbell_bench_press",
          label: "Bench Press",
        }),
        createExerciseLog({
          badgeIds: ["form_issue"],
          exerciseId: "barbell_row",
          label: "Barbell Row",
        }),
        createExerciseLog({
          actualReps: [10, 8, 10],
          exerciseId: "lat_pulldown",
          label: "Lat Pulldown",
        }),
        createExerciseLog({
          actualReps: [6, 6, 5],
          exerciseId: "back_squat",
          label: "Back Squat",
        }),
      ],
    });
    const messages = getUserMessagesForSurface(
      buildUserMessages({
        recentlyCompletedSessionId: session._id,
        sessions: [session],
      }),
      "workout_summary"
    );

    expect(messages.map((message) => message.id)).toEqual([
      "workout-complete-session-1",
      "progression-reduce-or-modify",
      "progression-ready",
      "progression-repeat-weight",
      "progression-hold-steady",
    ]);
    expect(messages.find((message) => message.id === "progression-ready")?.body).toContain(
      "Bench Press"
    );
    expect(
      messages.find((message) => message.id === "progression-repeat-weight")?.body
    ).toContain("Barbell Row");
    expect(
      messages.find((message) => message.id === "progression-hold-steady")?.body
    ).toContain("Lat Pulldown");
    expect(
      messages.find((message) => message.id === "progression-reduce-or-modify")
        ?.body
    ).toContain("Back Squat");
  });

  it("prioritizes pain cautions on the workout summary", () => {
    const session = createSession({
      exerciseLogs: [
        createExerciseLog({ badgeIds: ["pain"], label: "Overhead Press" }),
        createExerciseLog({ exerciseId: "seated_row", label: "Seated Row" }),
      ],
    });
    const messages = getUserMessagesForSurface(
      buildUserMessages({
        recentlyCompletedSessionId: session._id,
        sessions: [session],
      }),
      "workout_summary"
    );

    expect(messages[0].id).toBe("recovery-pain-signal");
    expect(messages[0].body).toContain("Overhead Press");
  });

  it("raises repeated pain above other dashboard messages", () => {
    const messages = buildUserMessages({
      sessions: [
        createSession({
          id: "prior-pain",
          scheduledFor: "2026-07-01T12:00:00.000Z",
          exerciseLogs: [
            createExerciseLog({ badgeIds: ["pain"], label: "Back Squat" }),
          ],
        }),
        createSession({
          id: "current-pain",
          scheduledFor: "2026-07-08T12:00:00.000Z",
          exerciseLogs: [
            createExerciseLog({ badgeIds: ["pain"], label: "Back Squat" }),
          ],
        }),
      ],
    });

    expect(getPrimaryUserMessage(messages, "dashboard")?.id).toBe(
      "recovery-repeated-pain"
    );
    expect(getPrimaryUserMessage(messages, "dashboard")?.severity).toBe("danger");
  });

  it("adds repeated form issue recovery messages", () => {
    const messages = buildUserMessages({
      sessions: [
        createSession({
          id: "prior-form",
          scheduledFor: "2026-07-01T12:00:00.000Z",
          exerciseLogs: [
            createExerciseLog({
              badgeIds: ["form_issue"],
              exerciseId: "barbell_row",
              label: "Barbell Row",
            }),
          ],
        }),
        createSession({
          id: "current-form",
          scheduledFor: "2026-07-08T12:00:00.000Z",
          exerciseLogs: [
            createExerciseLog({
              badgeIds: ["form_issue"],
              exerciseId: "barbell_row",
              label: "Barbell Row",
            }),
          ],
        }),
      ],
    });

    expect(messages.some((message) => message.id === "recovery-form-pattern")).toBe(
      true
    );
  });

  it("removes pain recovery messages after exercise badges are cleared", () => {
    const messages = buildUserMessages({
      sessions: [
        createSession({
          exerciseLogs: [
            createExerciseLog({
              badgeIds: [],
              exerciseId: "standing_overhead_press",
              label: "Overhead Press",
            }),
          ],
        }),
      ],
    });

    expect(
      messages.some((message) => message.id.startsWith("recovery-pain"))
    ).toBe(false);
  });

  it("resolves pain recovery messages when the latest exercise log is clean", () => {
    const messages = buildUserMessages({
      sessions: [
        createSession({
          id: "prior-pain",
          scheduledFor: "2026-07-01T12:00:00.000Z",
          exerciseLogs: [
            createExerciseLog({
              badgeIds: ["pain"],
              exerciseId: "standing_overhead_press",
              label: "Overhead Press",
            }),
          ],
        }),
        createSession({
          id: "current-clean",
          scheduledFor: "2026-07-08T12:00:00.000Z",
          exerciseLogs: [
            createExerciseLog({
              badgeIds: [],
              exerciseId: "standing_overhead_press",
              label: "Overhead Press",
            }),
          ],
        }),
      ],
    });

    expect(
      messages.some((message) => message.id.startsWith("recovery-pain"))
    ).toBe(false);
  });

  it("removes repeated form recovery messages after form badges are cleared", () => {
    const messages = buildUserMessages({
      sessions: [
        createSession({
          id: "prior-cleared-form",
          scheduledFor: "2026-07-01T12:00:00.000Z",
          exerciseLogs: [
            createExerciseLog({
              badgeIds: [],
              exerciseId: "barbell_row",
              label: "Barbell Row",
            }),
          ],
        }),
        createSession({
          id: "current-cleared-form",
          scheduledFor: "2026-07-08T12:00:00.000Z",
          exerciseLogs: [
            createExerciseLog({
              badgeIds: [],
              exerciseId: "barbell_row",
              label: "Barbell Row",
            }),
          ],
        }),
      ],
    });

    expect(
      messages.some((message) => message.id === "recovery-form-pattern")
    ).toBe(false);
  });

  it("adds repeated missed target recovery messages", () => {
    const messages = buildUserMessages({
      sessions: [
        createSession({
          id: "prior-missed",
          scheduledFor: "2026-07-01T12:00:00.000Z",
          exerciseLogs: [
            createExerciseLog({
              actualReps: [10, 8, 10],
              exerciseId: "lat_pulldown",
              label: "Lat Pulldown",
            }),
          ],
        }),
        createSession({
          id: "current-missed",
          scheduledFor: "2026-07-08T12:00:00.000Z",
          exerciseLogs: [
            createExerciseLog({
              actualReps: [9, 8, 10],
              exerciseId: "lat_pulldown",
              label: "Lat Pulldown",
            }),
          ],
        }),
      ],
    });

    expect(
      messages.some((message) => message.id === "recovery-missed-targets")
    ).toBe(true);
  });

  it("resolves missed-target messages when the latest exercise log hits targets", () => {
    const messages = buildUserMessages({
      sessions: [
        createSession({
          id: "prior-missed-1",
          scheduledFor: "2026-07-01T12:00:00.000Z",
          exerciseLogs: [
            createExerciseLog({
              actualReps: [10, 8, 10],
              exerciseId: "lat_pulldown",
              label: "Lat Pulldown",
            }),
          ],
        }),
        createSession({
          id: "prior-missed-2",
          scheduledFor: "2026-07-03T12:00:00.000Z",
          exerciseLogs: [
            createExerciseLog({
              actualReps: [9, 8, 10],
              exerciseId: "lat_pulldown",
              label: "Lat Pulldown",
            }),
          ],
        }),
        createSession({
          id: "current-clean",
          scheduledFor: "2026-07-08T12:00:00.000Z",
          exerciseLogs: [
            createExerciseLog({
              actualReps: [10, 10, 10],
              exerciseId: "lat_pulldown",
              label: "Lat Pulldown",
            }),
          ],
        }),
      ],
    });

    expect(
      messages.some((message) => message.id === "recovery-missed-targets")
    ).toBe(false);
  });

  it("ignores stale missed-target patterns outside the rolling window", () => {
    const messages = buildUserMessages({
      sessions: [
        createSession({
          id: "old-missed-1",
          scheduledFor: "2026-06-01T12:00:00.000Z",
          exerciseLogs: [
            createExerciseLog({
              actualReps: [10, 8, 10],
              exerciseId: "lat_pulldown",
              label: "Lat Pulldown",
            }),
          ],
        }),
        createSession({
          id: "old-missed-2",
          scheduledFor: "2026-06-08T12:00:00.000Z",
          exerciseLogs: [
            createExerciseLog({
              actualReps: [9, 8, 10],
              exerciseId: "lat_pulldown",
              label: "Lat Pulldown",
            }),
          ],
        }),
        createSession({
          id: "current-clean",
          scheduledFor: "2026-07-08T12:00:00.000Z",
          exerciseLogs: [
            createExerciseLog({
              actualReps: [10, 10, 10],
              exerciseId: "barbell_bench_press",
              label: "Bench Press",
            }),
          ],
        }),
      ],
    });

    expect(
      messages.some((message) => message.id === "recovery-missed-targets")
    ).toBe(false);
  });

  it("limits weekly completion messages to the latest workout week", () => {
    const messages = buildUserMessages({
      preview: createPreview(["day-1", "day-2"]),
      sessions: [
        createSession({
          id: "old-day-1",
          label: "day-1",
          programDayId: "day-1",
          scheduledFor: "2026-07-01T12:00:00.000Z",
        }),
        createSession({
          id: "current-day-2",
          label: "day-2",
          programDayId: "day-2",
          scheduledFor: "2026-07-08T12:00:00.000Z",
        }),
      ],
    });

    expect(
      messages.some((message) => message.id === "weekly-target-complete")
    ).toBe(false);
  });

  it("surfaces active exercise recovery cautions on the workout exercise page", () => {
    const messages = buildUserMessages({
      activeExerciseId: "barbell_row",
      sessions: [
        createSession({
          id: "prior-form",
          scheduledFor: "2026-07-01T12:00:00.000Z",
          exerciseLogs: [
            createExerciseLog({
              badgeIds: ["form_issue"],
              exerciseId: "barbell_row",
              label: "Barbell Row",
            }),
          ],
        }),
        createSession({
          id: "current-form",
          scheduledFor: "2026-07-08T12:00:00.000Z",
          exerciseLogs: [
            createExerciseLog({
              badgeIds: ["form_issue"],
              exerciseId: "barbell_row",
              label: "Barbell Row",
            }),
          ],
        }),
      ],
    });

    expect(getUserMessagesForSurface(messages, "workout_exercise")).toEqual([
      expect.objectContaining({ id: "recovery-form-pattern" }),
    ]);
  });

  it("adds personal record messages to workout summary and trends", () => {
    const priorSession = createSession({
      id: "prior-session",
      scheduledFor: "2026-07-01T12:00:00.000Z",
      exerciseLogs: [
        createExerciseLog({
          exerciseId: "barbell_bench_press",
          label: "Bench Press",
          weight: 135,
        }),
      ],
    });
    const currentSession = createSession({
      id: "current-session",
      scheduledFor: "2026-07-08T12:00:00.000Z",
      exerciseLogs: [
        createExerciseLog({
          exerciseId: "barbell_bench_press",
          label: "Bench Press",
          weight: 145,
        }),
      ],
    });
    const messages = buildUserMessages({
      recentlyCompletedSessionId: currentSession._id,
      sessions: [priorSession, currentSession],
    });

    expect(
      getUserMessagesForSurface(messages, "workout_summary").some(
        (message) => message.id === "personal-record-current-session"
      )
    ).toBe(true);
    expect(
      getUserMessagesForSurface(messages, "trends").some(
        (message) => message.id === "personal-record-current-session"
      )
    ).toBe(true);
    expect(
      getUserMessagesForSurface(messages, "trends").find(
        (message) => message.id === "personal-record-current-session"
      )
    ).toEqual(
      expect.objectContaining({
        body: expect.stringContaining("all-time compound-lift record"),
        title: "New all-time personal record",
      })
    );
  });

  it("does not keep showing an old PR after a newer completed workout has no PR", () => {
    const priorSession = createSession({
      id: "prior-session",
      scheduledFor: "2026-07-01T12:00:00.000Z",
      exerciseLogs: [
        createExerciseLog({
          exerciseId: "barbell_bench_press",
          label: "Bench Press",
          weight: 135,
        }),
      ],
    });
    const prSession = createSession({
      id: "pr-session",
      scheduledFor: "2026-07-08T12:00:00.000Z",
      exerciseLogs: [
        createExerciseLog({
          exerciseId: "barbell_bench_press",
          label: "Bench Press",
          weight: 145,
        }),
      ],
    });
    const newerSession = createSession({
      id: "newer-session",
      scheduledFor: "2026-07-15T12:00:00.000Z",
      exerciseLogs: [
        createExerciseLog({
          exerciseId: "barbell_bench_press",
          label: "Bench Press",
          weight: 140,
        }),
      ],
    });
    const messages = buildUserMessages({
      recentlyCompletedSessionId: prSession._id,
      sessions: [priorSession, prSession, newerSession],
    });

    expect(
      messages.some((message) => message.id === "personal-record-pr-session")
    ).toBe(false);
  });

  it("filters and returns the primary message for a surface", () => {
    const messages = buildUserMessages({
      sessions: [
        createSession({
          exerciseLogs: [
            createExerciseLog({ badgeIds: ["pain"], label: "Back Squat" }),
            createExerciseLog({ exerciseId: "seated_row", label: "Seated Row" }),
          ],
        }),
      ],
    });

    expect(getUserMessagesForSurface(messages, "workout_exercise")).toHaveLength(0);
    expect(getPrimaryUserMessage(messages, "dashboard")?.id).toBe(
      "recovery-pain-signal"
    );
  });

  it("returns compact secondary messages after the primary surface message", () => {
    const messages = buildUserMessages({
      preview: createPreview(["chest-day"]),
      sessions: [
        createSession({
          exerciseLogs: [
            createExerciseLog({ badgeIds: ["pain"], label: "Back Squat" }),
            createExerciseLog({ exerciseId: "seated_row", label: "Seated Row" }),
          ],
          programDayId: "chest-day",
        }),
      ],
    });

    expect(getPrimaryUserMessage(messages, "dashboard")?.id).toBe(
      "recovery-pain-signal"
    );
    expect(
      getSecondaryUserMessages(messages, "dashboard").map((message) => message.id)
    ).toEqual(["weekly-target-complete", "progression-ready"]);
  });

  it("adds a weekly completion dashboard message for a completed 3-day plan", () => {
    const messages = buildUserMessages({
      preview: createPreview(["day-1", "day-2", "day-3"]),
      sessions: createCompletedPlannedSessions(["day-1", "day-2", "day-3"]),
    });

    const message = messages.find(
      (currentMessage) => currentMessage.id === "weekly-target-complete"
    );

    expect(message?.title).toBe("Weekly target complete");
    expect(message?.body).toContain("all 3 planned workouts");
  });

  it("adds a weekly completion dashboard message for a completed 4-day plan", () => {
    const messages = buildUserMessages({
      preview: createPreview(["day-1", "day-2", "day-3", "day-4"]),
      sessions: createCompletedPlannedSessions([
        "day-1",
        "day-2",
        "day-3",
        "day-4",
      ]),
    });

    expect(getPrimaryUserMessage(messages, "dashboard")?.body).toContain(
      "all 4 planned workouts"
    );
  });

  it("adds a weekly completion dashboard message for a completed 5-day plan", () => {
    const messages = buildUserMessages({
      preview: createPreview(["day-1", "day-2", "day-3", "day-4", "day-5"]),
      sessions: createCompletedPlannedSessions([
        "day-1",
        "day-2",
        "day-3",
        "day-4",
        "day-5",
      ]),
    });

    expect(getPrimaryUserMessage(messages, "dashboard")?.body).toContain(
      "all 5 planned workouts"
    );
  });

  it("does not count archived 5-day program sessions toward a new 3-day weekly target", () => {
    const archivedFiveDaySessions = createCompletedPlannedSessions([
      "day-1",
      "day-2",
      "day-3",
      "day-4",
      "day-5",
    ]).map((session) => ({
      ...session,
      programHistoryId: "history-1",
      programId: "bro_split",
      programVersion: 1,
    }));

    const messages = buildUserMessages({
      currentProgramScope: {
        activeProgramHistoryId: "history-2",
        programId: "full_body_3_day",
        programVersion: 2,
        workoutPlanId: "plan-1",
      },
      preview: createPreview(["day-1", "day-2", "day-3"]),
      sessions: archivedFiveDaySessions,
    });

    expect(
      messages.some((message) => message.id === "weekly-target-complete")
    ).toBe(false);
  });

  it("counts only current 3-day program sessions after switching from a 5-day plan", () => {
    const archivedFiveDaySessions = createCompletedPlannedSessions([
      "old-day-1",
      "old-day-2",
      "old-day-3",
      "old-day-4",
      "old-day-5",
    ]).map((session) => ({
      ...session,
      programHistoryId: "history-1",
      programId: "bro_split",
      programVersion: 1,
    }));
    const currentThreeDaySessions = createCompletedPlannedSessions([
      "day-1",
      "day-2",
      "day-3",
    ]).map((session) => ({
      ...session,
      programHistoryId: "history-2",
      programId: "full_body_3_day",
      programVersion: 2,
    }));

    const messages = buildUserMessages({
      currentProgramScope: {
        activeProgramHistoryId: "history-2",
        programId: "full_body_3_day",
        programVersion: 2,
        workoutPlanId: "plan-1",
      },
      preview: createPreview(["day-1", "day-2", "day-3"]),
      sessions: [...archivedFiveDaySessions, ...currentThreeDaySessions],
    });

    expect(getPrimaryUserMessage(messages, "dashboard")?.body).toContain(
      "all 3 planned workouts"
    );
  });

  it("mentions extra sessions after the weekly target is completed", () => {
    const messages = buildUserMessages({
      preview: createPreview(["day-1", "day-2", "day-3"]),
      sessions: [
        ...createCompletedPlannedSessions(["day-1", "day-2", "day-3"]),
        createSession({
          id: "session-extra",
          label: "Conditioning",
          programDayId: "extra-conditioning",
        }),
      ],
    });

    expect(getPrimaryUserMessage(messages, "dashboard")?.body).toContain(
      "plus 1 extra session"
    );
  });

  it("hides disabled message categories", () => {
    const messages = buildUserMessages({
      messagePreferences: createMessagePreferences({
        categories: {
          completion: false,
        },
      }),
      preview: createPreview(["day-1", "day-2", "day-3"]),
      sessions: createCompletedPlannedSessions(["day-1", "day-2", "day-3"]),
    });

    expect(
      messages.some((message) => message.id === "weekly-target-complete")
    ).toBe(false);
  });

  it("keeps protected recovery messages visible when recovery is disabled", () => {
    const messages = buildUserMessages({
      messagePreferences: createMessagePreferences({
        categories: {
          recovery: false,
        },
      }),
      sessions: [
        createSession({
          exerciseLogs: [
            createExerciseLog({ badgeIds: ["pain"], label: "Overhead Press" }),
          ],
        }),
      ],
    });

    expect(messages.some((message) => message.id === "recovery-pain-signal")).toBe(
      true
    );
  });

  it("reduces lower-priority messages when frequency is fewer", () => {
    const messages = buildUserMessages({
      messagePreferences: createMessagePreferences({
        frequency: "fewer",
      }),
      preview: createPreview(["day-1"]),
      sessions: createCompletedPlannedSessions(["day-1"]),
    });

    expect(
      messages.some((message) => message.id === "weekly-target-complete")
    ).toBe(false);
    expect(messages.some((message) => message.id === "progression-ready")).toBe(
      true
    );
  });

  it("only shows warning-level messages in important-only mode", () => {
    const messages = buildUserMessages({
      messagePreferences: createMessagePreferences({
        frequency: "important_only",
      }),
      preview: createPreview(["day-1"]),
      sessions: [
        createSession({
          exerciseLogs: [
            createExerciseLog({ badgeIds: ["pain"], label: "Overhead Press" }),
          ],
          programDayId: "day-1",
        }),
      ],
    });

    expect(messages.map((message) => message.id)).toEqual([
      "recovery-pain-signal",
    ]);
  });

  it("snoozes non-critical messages while keeping protected recovery cautions", () => {
    const messages = buildUserMessages({
      messagePreferences: createMessagePreferences({
        nonCriticalSnoozedUntil: "2026-07-28T12:00:00.000Z",
      }),
      now: new Date("2026-07-21T12:00:00.000Z"),
      preview: createPreview(["day-1"]),
      sessions: [
        createSession({
          exerciseLogs: [
            createExerciseLog({ badgeIds: ["pain"], label: "Overhead Press" }),
          ],
          programDayId: "day-1",
        }),
      ],
    });

    expect(messages.map((message) => message.id)).toEqual([
      "recovery-pain-signal",
    ]);
  });

  it("shows non-critical messages again after the snooze expires", () => {
    const messages = buildUserMessages({
      messagePreferences: createMessagePreferences({
        nonCriticalSnoozedUntil: "2026-07-20T12:00:00.000Z",
      }),
      now: new Date("2026-07-21T12:00:00.000Z"),
      preview: createPreview(["day-1"]),
      sessions: createCompletedPlannedSessions(["day-1"]),
    });

    expect(
      messages.some((message) => message.id === "weekly-target-complete")
    ).toBe(true);
  });

  it("hides messages from disabled surfaces", () => {
    const messages = buildUserMessages({
      messagePreferences: createMessagePreferences({
        surfaces: {
          dashboard: false,
        },
      }),
      preview: createPreview(["day-1"]),
      sessions: createCompletedPlannedSessions(["day-1"]),
    });

    expect(getUserMessagesForSurface(messages, "dashboard")).toEqual([]);
  });
});
