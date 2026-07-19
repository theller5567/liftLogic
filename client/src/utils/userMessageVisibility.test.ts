import { describe, expect, it } from "vitest";

import {
  canDismissUserMessage,
  dismissUserMessage,
  filterVisibleUserMessages,
  markUserMessagesSeen,
  type UserMessageVisibilityState,
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

  it("shows a dismissed message again when the content changes", () => {
    const message = createMessage();
    const dismissedState = dismissUserMessage({
      message,
      now: new Date("2026-07-19T12:00:00.000Z"),
      state: {},
      surface: "dashboard",
    });
    const updatedMessage = createMessage({
      body: "You finished every planned workout plus one extra session.",
    });

    expect(
      filterVisibleUserMessages({
        messages: [updatedMessage],
        now: new Date("2026-07-20T12:00:00.000Z"),
        state: dismissedState,
        surface: "dashboard",
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

  it("keeps recovery caution messages visible and non-dismissible", () => {
    const message = createMessage({
      category: "recovery",
      id: "recovery-repeated-pain",
      severity: "danger",
      title: "Repeated pain signal",
    });
    const state: UserMessageVisibilityState = {};

    expect(canDismissUserMessage(message)).toBe(false);
    expect(
      filterVisibleUserMessages({
        messages: [message],
        now: new Date("2026-07-19T12:00:00.000Z"),
        state,
        surface: "dashboard",
      })
    ).toEqual([message]);
  });
});
