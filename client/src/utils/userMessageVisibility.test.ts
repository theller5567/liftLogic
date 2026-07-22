import { describe, expect, it } from "vitest";

import {
  canDismissUserMessage,
  dismissUserMessage,
  filterVisibleUserMessages,
  markUserMessagesSeen,
} from "./userMessageVisibility";
import type { UserMessage } from "./userMessages";

const createMessage = (
  overrides: Partial<UserMessage> = {}
): UserMessage => ({
  body: "You finished your planned work.",
  category: "completion",
  id: "weekly-target-complete",
  priority: 30,
  severity: "success",
  surfaces: ["dashboard"],
  title: "Weekly target complete",
  ...overrides,
});

describe("user message visibility", () => {
  it("suppresses a dismissed non-critical dashboard message", () => {
    const message = createMessage();
    const dismissedState = dismissUserMessage({
      message,
      now: new Date("2026-07-19T12:00:00.000Z"),
      state: {},
      surface: "dashboard",
    });

    expect(
      filterVisibleUserMessages({
        messages: [message],
        now: new Date("2026-07-20T12:00:00.000Z"),
        state: dismissedState,
        surface: "dashboard",
      })
    ).toEqual([]);
  });

  it("keeps a dismissed lifecycle message hidden when only the copy changes", () => {
    const message = createMessage({
      lifecycle: {
        dismissalPolicy: {
          cooldownHours: 168,
          returnWhenChanged: true,
        },
        scope: "current_week",
        sourceExerciseIds: ["workout-a", "workout-b"],
        stateKey: "weekly_target_complete",
      },
    });
    const dismissedState = dismissUserMessage({
      message,
      now: new Date("2026-07-19T12:00:00.000Z"),
      state: {},
      surface: "dashboard",
    });
    const updatedMessage = createMessage({
      ...message,
      body: "You finished every planned workout plus one extra session.",
    });

    expect(
      filterVisibleUserMessages({
        messages: [updatedMessage],
        now: new Date("2026-07-20T12:00:00.000Z"),
        state: dismissedState,
        surface: "dashboard",
      })
    ).toEqual([]);
  });

  it("shows a dismissed lifecycle message again when source exercises change", () => {
    const message = createMessage({
      id: "recovery-load-selection-pattern",
      lifecycle: {
        dismissalPolicy: {
          cooldownHours: 24,
          returnWhenChanged: true,
        },
        scope: "training_pattern",
        sourceExerciseIds: ["barbell_bench_press"],
        stateKey: "load_selection_pattern",
      },
      severity: "warning",
      title: "Review load selection",
    });
    const dismissedState = dismissUserMessage({
      message,
      now: new Date("2026-07-19T12:00:00.000Z"),
      state: {},
      surface: "trends",
    });
    const updatedMessage = createMessage({
      ...message,
      lifecycle: {
        ...message.lifecycle!,
        sourceExerciseIds: ["barbell_bench_press", "back_squat"],
      },
    });

    expect(
      filterVisibleUserMessages({
        messages: [updatedMessage],
        now: new Date("2026-07-19T13:00:00.000Z"),
        state: dismissedState,
        surface: "trends",
      })
    ).toEqual([updatedMessage]);
  });

  it("shows a dismissed non-critical message again after the cooldown", () => {
    const message = createMessage();
    const dismissedState = dismissUserMessage({
      message,
      now: new Date("2026-07-01T12:00:00.000Z"),
      state: {},
      surface: "dashboard",
    });

    expect(
      filterVisibleUserMessages({
        messages: [message],
        now: new Date("2026-07-10T12:00:00.000Z"),
        state: dismissedState,
        surface: "dashboard",
      })
    ).toEqual([message]);
  });

  it("temporarily suppresses a non-critical message after repeated dashboard views", () => {
    const message = createMessage();
    const firstSeenState = markUserMessagesSeen({
      messages: [message],
      now: new Date("2026-07-19T09:00:00.000Z"),
      state: {},
      surface: "dashboard",
    });
    const secondSeenState = markUserMessagesSeen({
      messages: [message],
      now: new Date("2026-07-19T10:00:00.000Z"),
      state: firstSeenState,
      surface: "dashboard",
    });
    const thirdSeenState = markUserMessagesSeen({
      messages: [message],
      now: new Date("2026-07-19T11:00:00.000Z"),
      state: secondSeenState,
      surface: "dashboard",
    });

    expect(
      filterVisibleUserMessages({
        messages: [message],
        now: new Date("2026-07-19T12:00:00.000Z"),
        state: thirdSeenState,
        surface: "dashboard",
      })
    ).toEqual([]);
  });

  it("temporarily suppresses dismissed recovery cautions", () => {
    const message = createMessage({
      category: "recovery",
      id: "recovery-repeated-pain",
      lifecycle: {
        dismissalPolicy: {
          cooldownHours: 24,
          returnWhenChanged: true,
        },
        scope: "training_pattern",
        sourceExerciseIds: ["standing_overhead_press"],
      },
      severity: "danger",
      title: "Repeated pain signal",
    });
    const dismissedState = dismissUserMessage({
      message,
      now: new Date("2026-07-19T12:00:00.000Z"),
      state: {},
      surface: "dashboard",
    });

    expect(canDismissUserMessage(message)).toBe(true);
    expect(
      filterVisibleUserMessages({
        messages: [message],
        now: new Date("2026-07-19T18:00:00.000Z"),
        state: dismissedState,
        surface: "dashboard",
      })
    ).toEqual([]);
    expect(
      filterVisibleUserMessages({
        messages: [message],
        now: new Date("2026-07-21T12:00:00.000Z"),
        state: dismissedState,
        surface: "dashboard",
      })
    ).toEqual([message]);
  });

  it("brings a dismissed warning back when its source context changes", () => {
    const message = createMessage({
      category: "progressive_overload",
      id: "progression-reduce-or-modify",
      lifecycle: {
        dismissalPolicy: {
          cooldownHours: 24,
          returnWhenChanged: true,
        },
        scope: "exercise_action",
        sourceExerciseIds: ["back_squat"],
        stateKey: "load_too_high",
      },
      severity: "warning",
      title: "Drop the load or modify",
    });
    const dismissedState = dismissUserMessage({
      message,
      now: new Date("2026-07-19T12:00:00.000Z"),
      state: {},
      surface: "trends",
    });
    const updatedMessage = {
      ...message,
      lifecycle: {
        ...message.lifecycle!,
        sourceExerciseIds: ["back_squat", "barbell_bench_press"],
      },
    };

    expect(
      filterVisibleUserMessages({
        messages: [updatedMessage],
        now: new Date("2026-07-19T18:00:00.000Z"),
        state: dismissedState,
        surface: "trends",
      })
    ).toEqual([updatedMessage]);
  });

  it("brings a dismissed warning back when its state changes", () => {
    const message = createMessage({
      category: "progressive_overload",
      id: "progression-guidance",
      lifecycle: {
        dismissalPolicy: {
          cooldownHours: 24,
          returnWhenChanged: true,
        },
        scope: "exercise_action",
        sourceExerciseIds: ["back_squat"],
        stateKey: "hold_steady",
      },
      severity: "warning",
      title: "Hold steady",
    });
    const dismissedState = dismissUserMessage({
      message,
      now: new Date("2026-07-19T12:00:00.000Z"),
      state: {},
      surface: "trends",
    });
    const updatedMessage = {
      ...message,
      lifecycle: {
        ...message.lifecycle!,
        stateKey: "load_too_high",
      },
      title: "Drop the load or modify",
    };

    expect(
      filterVisibleUserMessages({
        messages: [updatedMessage],
        now: new Date("2026-07-19T18:00:00.000Z"),
        state: dismissedState,
        surface: "trends",
      })
    ).toEqual([updatedMessage]);
  });

  it("does not treat reordered source exercise ids as a new message", () => {
    const message = createMessage({
      category: "progressive_overload",
      id: "progression-reduce-or-modify",
      lifecycle: {
        dismissalPolicy: {
          cooldownHours: 24,
          returnWhenChanged: true,
        },
        scope: "exercise_action",
        sourceExerciseIds: ["back_squat", "barbell_bench_press"],
        stateKey: "load_too_high",
      },
      severity: "warning",
      title: "Drop the load or modify",
    });
    const dismissedState = dismissUserMessage({
      message,
      now: new Date("2026-07-19T12:00:00.000Z"),
      state: {},
      surface: "trends",
    });
    const updatedMessage = {
      ...message,
      lifecycle: {
        ...message.lifecycle!,
        sourceExerciseIds: ["barbell_bench_press", "back_squat"],
      },
    };

    expect(
      filterVisibleUserMessages({
        messages: [updatedMessage],
        now: new Date("2026-07-19T18:00:00.000Z"),
        state: dismissedState,
        surface: "trends",
      })
    ).toEqual([]);
  });

  it("hides expired messages", () => {
    const message = createMessage({
      lifecycle: {
        dismissalPolicy: {
          cooldownHours: 168,
          returnWhenChanged: true,
        },
        expiresAt: "2026-07-20T12:00:00.000Z",
        scope: "latest_workout",
        sourceSessionId: "session-1",
      },
    });

    expect(
      filterVisibleUserMessages({
        messages: [message],
        now: new Date("2026-07-21T12:00:00.000Z"),
        state: {},
        surface: "dashboard",
      })
    ).toEqual([]);
  });
});
