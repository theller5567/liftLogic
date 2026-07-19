import type { UserMessageSurface } from "../../../shared/types/userSettings.types";
import type { UserMessage } from "./userMessages";

export type UserMessageVisibilityRecord = {
  dismissedAt?: string;
  fingerprint: string;
  firstSeenAt: string;
  lastSeenAt: string;
  seenCount: number;
};

export type UserMessageVisibilityState = Record<
  string,
  UserMessageVisibilityRecord
>;

const STORAGE_KEY = "liftlogic:user-messages:v1";
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const SEEN_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const MAX_RECENT_SEEN_COUNT = 3;

const canUseStorage = () => typeof window !== "undefined";

export const getUserMessageVisibilityKey = (
  message: Pick<UserMessage, "id">,
  surface: UserMessageSurface
) => `${surface}:${message.id}`;

export const getUserMessageFingerprint = (message: UserMessage) =>
  `${message.id}:${message.title}:${message.body}`;

export const isProtectedUserMessage = (message: UserMessage) =>
  message.category === "recovery" ||
  message.severity === "warning" ||
  message.severity === "danger";

export const readUserMessageVisibilityState = (): UserMessageVisibilityState => {
  if (!canUseStorage()) {
    return {};
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return {};
  }

  try {
    return JSON.parse(rawValue) as UserMessageVisibilityState;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return {};
  }
};

const writeUserMessageVisibilityState = (
  state: UserMessageVisibilityState
) => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const isWithinCooldown = (
  isoDate: string | undefined,
  now: Date,
  cooldownMs: number
) => {
  if (!isoDate) {
    return false;
  }

  const timestamp = new Date(isoDate).getTime();

  return Number.isFinite(timestamp) && now.getTime() - timestamp < cooldownMs;
};

export const canDismissUserMessage = (message: UserMessage) =>
  !isProtectedUserMessage(message);

export const shouldShowUserMessage = ({
  message,
  now = new Date(),
  state,
  surface,
}: {
  message: UserMessage;
  now?: Date;
  state: UserMessageVisibilityState;
  surface: UserMessageSurface;
}) => {
  if (isProtectedUserMessage(message)) {
    return true;
  }

  const key = getUserMessageVisibilityKey(message, surface);
  const record = state[key];

  if (!record || record.fingerprint !== getUserMessageFingerprint(message)) {
    return true;
  }

  if (isWithinCooldown(record.dismissedAt, now, DISMISS_COOLDOWN_MS)) {
    return false;
  }

  return !(
    record.seenCount >= MAX_RECENT_SEEN_COUNT &&
    isWithinCooldown(record.lastSeenAt, now, SEEN_COOLDOWN_MS)
  );
};

export const filterVisibleUserMessages = ({
  messages,
  now = new Date(),
  state,
  surface,
}: {
  messages: UserMessage[];
  now?: Date;
  state: UserMessageVisibilityState;
  surface: UserMessageSurface;
}) =>
  messages.filter((message) =>
    shouldShowUserMessage({ message, now, state, surface })
  );

export const markUserMessagesSeen = ({
  messages,
  now = new Date(),
  state = readUserMessageVisibilityState(),
  surface,
}: {
  messages: UserMessage[];
  now?: Date;
  state?: UserMessageVisibilityState;
  surface: UserMessageSurface;
}) => {
  const nextState: UserMessageVisibilityState = { ...state };
  const seenAt = now.toISOString();

  for (const message of messages) {
    if (isProtectedUserMessage(message)) {
      continue;
    }

    const key = getUserMessageVisibilityKey(message, surface);
    const fingerprint = getUserMessageFingerprint(message);
    const currentRecord = nextState[key];
    const shouldResetRecord =
      !currentRecord || currentRecord.fingerprint !== fingerprint;

    nextState[key] = shouldResetRecord
      ? {
          fingerprint,
          firstSeenAt: seenAt,
          lastSeenAt: seenAt,
          seenCount: 1,
        }
      : {
          ...currentRecord,
          lastSeenAt: seenAt,
          seenCount: currentRecord.seenCount + 1,
        };
  }

  writeUserMessageVisibilityState(nextState);
  return nextState;
};

export const dismissUserMessage = ({
  message,
  now = new Date(),
  state = readUserMessageVisibilityState(),
  surface,
}: {
  message: UserMessage;
  now?: Date;
  state?: UserMessageVisibilityState;
  surface: UserMessageSurface;
}) => {
  if (!canDismissUserMessage(message)) {
    return state;
  }

  const key = getUserMessageVisibilityKey(message, surface);
  const fingerprint = getUserMessageFingerprint(message);
  const dismissedAt = now.toISOString();
  const currentRecord = state[key];
  const nextState = {
    ...state,
    [key]: {
      fingerprint,
      firstSeenAt: currentRecord?.firstSeenAt ?? dismissedAt,
      lastSeenAt: dismissedAt,
      seenCount: currentRecord?.seenCount ?? 0,
      dismissedAt,
    },
  };

  writeUserMessageVisibilityState(nextState);
  return nextState;
};
