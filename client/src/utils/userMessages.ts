import type {
  UserMessageCategory,
  UserMessagePreferences,
  UserMessageSurface,
} from "../../../shared/types/userSettings.types";
import { DEFAULT_MESSAGE_PREFERENCES } from "../../../shared/types/userSettings.types";
import type {
  WorkoutExerciseLog,
  WorkoutSessionDto,
} from "../../../shared/types/workoutSession.types";
import {
  filterActiveWorkoutSessions,
  filterCurrentProgramWorkoutSessions,
  type CurrentProgramScope,
  type ExerciseHistoryScopeOptions,
} from "../../../shared/utils/workoutSessionScope";
import type { GeneratedWorkoutPreview } from "./generateWorkoutPreview";
import { getPersonalRecordsForSession, type PersonalRecord } from "./personalRecords";
import { buildProgressionSummary } from "./progressionSummary";
import { getEndOfWeek, getStartOfWeek } from "./workoutSessionDates";
import {
  completedAllTargetSets,
  hasLoadTooHighSignal,
} from "./workoutAdvisory";

export type UserMessageSeverity = "info" | "success" | "warning" | "danger";

export type UserMessageAction = {
  label: string;
  to?: string;
};

export type UserMessageScope =
  | "latest_workout"
  | "current_week"
  | "training_pattern"
  | "exercise_action"
  | "education";

export type UserMessageDismissalPolicy = {
  cooldownHours: number;
  returnWhenChanged: boolean;
};

export type UserMessageLifecycle = {
  dismissalPolicy: UserMessageDismissalPolicy;
  expiresAt?: string;
  scope: UserMessageScope;
  sourceExerciseIds?: string[];
  sourceSessionId?: string;
  stateKey?: string;
};

export type UserMessage = {
  id: string;
  category: UserMessageCategory;
  lifecycle?: UserMessageLifecycle;
  severity: UserMessageSeverity;
  priority: number;
  title: string;
  body: string;
  surfaces: UserMessageSurface[];
  action?: UserMessageAction;
};

export type TrendUserMessageGroupId =
  | "latest_workout_insights"
  | "training_patterns";

export type TrendUserMessageGroup = {
  id: TrendUserMessageGroupId;
  label: string;
  messages: UserMessage[];
};

export type BuildUserMessagesInput = {
  preview?: Pick<GeneratedWorkoutPreview, "days"> | null;
  sessions: WorkoutSessionDto[];
  currentProgramScope?: CurrentProgramScope;
  exerciseHistoryScope?: ExerciseHistoryScopeOptions;
  recentlyCompletedSessionId?: string;
  activeExerciseId?: string;
  messagePreferences?: UserMessagePreferences;
  now?: Date;
};

const formatExerciseList = (labels: string[]) => {
  const uniqueLabels = [...new Set(labels)];

  if (uniqueLabels.length === 0) {
    return "";
  }

  if (uniqueLabels.length === 1) {
    return uniqueLabels[0];
  }

  if (uniqueLabels.length === 2) {
    return `${uniqueLabels[0]} and ${uniqueLabels[1]}`;
  }

  return `${uniqueLabels[0]}, ${uniqueLabels[1]}, and ${
    uniqueLabels.length - 2
  } more`;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const RECOVERY_PATTERN_WINDOW_DAYS = 28;
const MISSED_TARGET_PATTERN_WINDOW_DAYS = 21;

const addDaysIso = (value: string, days: number) => {
  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return undefined;
  }

  return new Date(timestamp + days * DAY_MS).toISOString();
};

const getSourceExerciseIds = (exerciseLogs: WorkoutExerciseLog[]) => [
  ...new Set(exerciseLogs.map((exerciseLog) => exerciseLog.exerciseId)),
];

const getPatternSourceExerciseIds = (
  exerciseLogs: WorkoutExerciseLog[],
  predicate: (exerciseLog: WorkoutExerciseLog) => boolean
) => getSourceExerciseIds(exerciseLogs.filter(predicate));

const createLifecycle = (
  lifecycle: Omit<UserMessageLifecycle, "dismissalPolicy"> & {
    dismissalCooldownHours?: number;
    returnWhenChanged?: boolean;
  }
): UserMessageLifecycle => ({
  ...lifecycle,
  dismissalPolicy: {
    cooldownHours: lifecycle.dismissalCooldownHours ?? 168,
    returnWhenChanged: lifecycle.returnWhenChanged ?? true,
  },
});

const getSessionTime = (session: WorkoutSessionDto) =>
  new Date(session.scheduledFor).getTime();

const getLatestCompletedSession = (sessions: WorkoutSessionDto[]) =>
  sessions
    .filter((session) => session.status === "completed")
    .sort((left, right) => getSessionTime(right) - getSessionTime(left))[0] ??
  null;

const getReferenceDate = (sessions: WorkoutSessionDto[]) => {
  const latestCompletedSession = getLatestCompletedSession(sessions);
  const timestamp = latestCompletedSession
    ? getSessionTime(latestCompletedSession)
    : Date.now();

  return new Date(timestamp);
};

const filterCompletedSessionsWithinDays = (
  sessions: WorkoutSessionDto[],
  referenceDate: Date,
  days: number
) => {
  const referenceTime = referenceDate.getTime();
  const startTime = referenceTime - days * DAY_MS;

  return sessions.filter((session) => {
    const sessionTime = getSessionTime(session);

    return (
      session.status === "completed" &&
      Number.isFinite(sessionTime) &&
      sessionTime >= startTime &&
      sessionTime <= referenceTime
    );
  });
};

const filterSessionsInReferenceWeek = (
  sessions: WorkoutSessionDto[],
  referenceDate: Date
) => {
  const weekStart = getStartOfWeek(referenceDate).getTime();
  const weekEnd = getEndOfWeek(referenceDate).getTime();

  return sessions.filter((session) => {
    const sessionTime = getSessionTime(session);

    return (
      Number.isFinite(sessionTime) &&
      sessionTime >= weekStart &&
      sessionTime <= weekEnd
    );
  });
};

const isProtectedPreferenceMessage = (message: UserMessage) =>
  message.category === "recovery" &&
  (message.severity === "warning" || message.severity === "danger");

const getMergedMessagePreferences = (
  preferences?: UserMessagePreferences
): UserMessagePreferences => ({
  ...DEFAULT_MESSAGE_PREFERENCES,
  ...preferences,
  categories: {
    ...DEFAULT_MESSAGE_PREFERENCES.categories,
    ...preferences?.categories,
  },
  surfaces: {
    ...DEFAULT_MESSAGE_PREFERENCES.surfaces,
    ...preferences?.surfaces,
  },
});

const shouldShowForMessagePreferences = (
  message: UserMessage,
  preferences: UserMessagePreferences,
  now: Date
) => {
  const isProtected = isProtectedPreferenceMessage(message);
  const snoozedUntil = preferences.nonCriticalSnoozedUntil
    ? new Date(preferences.nonCriticalSnoozedUntil).getTime()
    : Number.NaN;

  if (!preferences.categories[message.category] && !isProtected) {
    return false;
  }

  if (
    !isProtected &&
    Number.isFinite(snoozedUntil) &&
    snoozedUntil > now.getTime()
  ) {
    return false;
  }

  const hasEnabledSurface = message.surfaces.some(
    (surface) => preferences.surfaces[surface]
  );

  if (!hasEnabledSurface && !isProtected) {
    return false;
  }

  if (isProtected) {
    return true;
  }

  if (preferences.frequency === "important_only") {
    return message.severity === "warning" || message.severity === "danger";
  }

  if (preferences.frequency === "fewer") {
    return (
      message.severity !== "info" &&
      message.category !== "completion" &&
      message.category !== "education"
    );
  }

  return true;
};

export const filterUserMessagesByPreferences = (
  messages: UserMessage[],
  preferences?: UserMessagePreferences,
  now = new Date()
) => {
  const mergedPreferences = getMergedMessagePreferences(preferences);

  return messages
    .filter((message) =>
      shouldShowForMessagePreferences(message, mergedPreferences, now)
    )
    .map((message) => ({
      ...message,
      surfaces: message.surfaces.filter(
        (surface) =>
          mergedPreferences.surfaces[surface] ||
          isProtectedPreferenceMessage(message)
      ),
    }))
    .filter((message) => message.surfaces.length > 0);
};

export const sortUserMessages = (messages: UserMessage[]) =>
  [...messages].sort((left, right) => {
    if (left.priority !== right.priority) {
      return left.priority - right.priority;
    }

    return left.title.localeCompare(right.title);
  });

export const getUserMessagesForSurface = (
  messages: UserMessage[],
  surface: UserMessageSurface
) => sortUserMessages(messages).filter((message) => message.surfaces.includes(surface));

export const getPrimaryUserMessage = (
  messages: UserMessage[],
  surface: UserMessageSurface
) => getUserMessagesForSurface(messages, surface)[0] ?? null;

export const getSecondaryUserMessages = (
  messages: UserMessage[],
  surface: UserMessageSurface,
  limit = 2
) => getUserMessagesForSurface(messages, surface).slice(1, limit + 1);

const isLatestWorkoutInsightMessage = (message: UserMessage) =>
  message.lifecycle?.scope === "latest_workout" ||
  message.lifecycle?.scope === "exercise_action";

export const groupTrendUserMessages = (
  messages: UserMessage[]
): TrendUserMessageGroup[] => {
  const sortedMessages = sortUserMessages(messages);
  const latestWorkoutMessages = sortedMessages.filter(
    isLatestWorkoutInsightMessage
  );
  const trainingPatternMessages = sortedMessages.filter(
    (message) => !isLatestWorkoutInsightMessage(message)
  );

  const groups: TrendUserMessageGroup[] = [
    {
      id: "latest_workout_insights",
      label: "Latest workout insights",
      messages: latestWorkoutMessages,
    },
    {
      id: "training_patterns",
      label: "Training patterns",
      messages: trainingPatternMessages,
    },
  ];

  return groups.filter((group) => group.messages.length > 0);
};

const buildCompletionMessage = (
  sessions: WorkoutSessionDto[],
  recentlyCompletedSessionId?: string
): UserMessage | null => {
  if (!recentlyCompletedSessionId) {
    return null;
  }

  const completedSession = sessions.find(
    (session) =>
      session._id === recentlyCompletedSessionId &&
      session.status === "completed"
  );

  if (!completedSession) {
    return null;
  }

  return {
    body: `${completedSession.programDayLabel} is logged. Your next session will use this data to guide progression.`,
    category: "completion",
    id: `workout-complete-${completedSession._id}`,
    lifecycle: createLifecycle({
      dismissalCooldownHours: 168,
      expiresAt: addDaysIso(completedSession.scheduledFor, 7),
      scope: "latest_workout",
      sourceExerciseIds: getSourceExerciseIds(completedSession.exerciseLogs),
      sourceSessionId: completedSession._id,
      stateKey: "workout_complete",
    }),
    priority: 30,
    severity: "success",
    surfaces: ["workout_summary"],
    title: "Workout complete",
  };
};

const buildWeeklyCompletionMessage = (
  sessions: WorkoutSessionDto[],
  preview: Pick<GeneratedWorkoutPreview, "days"> | null | undefined,
  referenceDate: Date
): UserMessage | null => {
  const plannedWorkoutIds = new Set(preview?.days.map((day) => day.id) ?? []);
  const plannedWorkoutCount = plannedWorkoutIds.size;

  if (plannedWorkoutCount === 0) {
    return null;
  }

  const completedSessions = filterSessionsInReferenceWeek(
    sessions,
    referenceDate
  ).filter((session) => session.status === "completed");
  const completedPlannedWorkoutIds = new Set(
    completedSessions
      .filter((session) => plannedWorkoutIds.has(session.programDayId))
      .map((session) => session.programDayId)
  );

  if (completedPlannedWorkoutIds.size < plannedWorkoutCount) {
    return null;
  }

  const extraWorkoutCount = completedSessions.filter(
    (session) => !plannedWorkoutIds.has(session.programDayId)
  ).length;
  const extraWorkoutCopy =
    extraWorkoutCount > 0
      ? ` plus ${extraWorkoutCount} extra ${
          extraWorkoutCount === 1 ? "session" : "sessions"
        }`
      : "";

  return {
    action: {
      label: "Review trends",
      to: "/trends",
    },
    body: `You finished all ${plannedWorkoutCount} planned workouts this week${extraWorkoutCopy}. Great consistency.`,
    category: "completion",
    id: "weekly-target-complete",
    lifecycle: createLifecycle({
      dismissalCooldownHours: 168,
      scope: "current_week",
      sourceExerciseIds: [...plannedWorkoutIds],
      stateKey: "weekly_target_complete",
    }),
    priority: 30,
    severity: "success",
    surfaces: ["dashboard"],
    title: "Weekly target complete",
  };
};

type CompletedExerciseLogEntry = {
  exerciseLog: WorkoutExerciseLog;
  time: number;
};

const getCompletedExerciseLogEntries = (
  sessions: WorkoutSessionDto[]
): CompletedExerciseLogEntry[] =>
  sessions
    .filter((session) => session.status === "completed")
    .flatMap((session) =>
      session.exerciseLogs.map((exerciseLog) => ({
        exerciseLog,
        time: getSessionTime(session),
      }))
    );

const getUnresolvedSignalExerciseLogs = (
  sessions: WorkoutSessionDto[],
  predicate: (exerciseLog: WorkoutExerciseLog) => boolean
) => {
  const latestEntriesByExercise = new Map<string, CompletedExerciseLogEntry>();

  for (const entry of getCompletedExerciseLogEntries(sessions)) {
    const current = latestEntriesByExercise.get(entry.exerciseLog.exerciseId);

    if (!current || entry.time > current.time) {
      latestEntriesByExercise.set(entry.exerciseLog.exerciseId, entry);
    }
  }

  return getCompletedExerciseLogEntries(sessions)
    .filter((entry) => predicate(entry.exerciseLog))
    .filter((entry) =>
      predicate(
        latestEntriesByExercise.get(entry.exerciseLog.exerciseId)?.exerciseLog ??
          entry.exerciseLog
      )
    )
    .map((entry) => entry.exerciseLog);
};

const hasMissedTargetSignal = (exerciseLog: WorkoutExerciseLog) =>
  exerciseLog.badgeIds.includes("missed_reps") ||
  !completedAllTargetSets(exerciseLog);

const getSignalLabels = (
  exerciseLogs: WorkoutExerciseLog[],
  predicate: (exerciseLog: WorkoutExerciseLog) => boolean
) => exerciseLogs.filter(predicate).map((exerciseLog) => exerciseLog.label);

const hasActiveExerciseSignal = (
  exerciseLogs: WorkoutExerciseLog[],
  activeExerciseId: string | undefined,
  predicate: (exerciseLog: WorkoutExerciseLog) => boolean,
  minCount = 1
) =>
  Boolean(activeExerciseId) &&
  exerciseLogs.filter(
    (exerciseLog) =>
      exerciseLog.exerciseId === activeExerciseId && predicate(exerciseLog)
  ).length >= minCount;

const getRecoverySurfaces = (
  exerciseLogs: WorkoutExerciseLog[],
  activeExerciseId: string | undefined,
  predicate: (exerciseLog: WorkoutExerciseLog) => boolean,
  minCount = 1
): UserMessageSurface[] => {
  const surfaces: UserMessageSurface[] = ["dashboard", "workout_summary", "trends"];

  if (hasActiveExerciseSignal(exerciseLogs, activeExerciseId, predicate, minCount)) {
    surfaces.push("workout_exercise");
  }

  return surfaces;
};

const buildRecoveryMessages = (
  sessions: WorkoutSessionDto[],
  referenceDate: Date,
  activeExerciseId?: string
): UserMessage[] => {
  const recoveryWindowSessions = filterCompletedSessionsWithinDays(
    sessions,
    referenceDate,
    RECOVERY_PATTERN_WINDOW_DAYS
  );
  const missedTargetWindowSessions = filterCompletedSessionsWithinDays(
    sessions,
    referenceDate,
    MISSED_TARGET_PATTERN_WINDOW_DAYS
  );
  const unresolvedPainExerciseLogs = getUnresolvedSignalExerciseLogs(
    recoveryWindowSessions,
    (exerciseLog) => exerciseLog.badgeIds.includes("pain")
  );
  const unresolvedFormIssueExerciseLogs = getUnresolvedSignalExerciseLogs(
    recoveryWindowSessions,
    (exerciseLog) => exerciseLog.badgeIds.includes("form_issue")
  );
  const unresolvedMissedTargetExerciseLogs = getUnresolvedSignalExerciseLogs(
    missedTargetWindowSessions,
    (exerciseLog) =>
      hasMissedTargetSignal(exerciseLog) && !hasLoadTooHighSignal(exerciseLog)
  );
  const painExerciseLabels = getSignalLabels(
    unresolvedPainExerciseLogs,
    (exerciseLog) => exerciseLog.badgeIds.includes("pain")
  );
  const formIssueLabels = getSignalLabels(
    unresolvedFormIssueExerciseLogs,
    (exerciseLog) => exerciseLog.badgeIds.includes("form_issue")
  );
  const missedTargetLabels = getSignalLabels(
    unresolvedMissedTargetExerciseLogs,
    (exerciseLog) =>
      hasMissedTargetSignal(exerciseLog) && !hasLoadTooHighSignal(exerciseLog)
  );
  const messages: UserMessage[] = [];

  if (painExerciseLabels.length >= 2) {
    messages.push({
      body: `${formatExerciseList(
        painExerciseLabels
      )} has been marked with pain more than once. Reduce load, use a pain-free range, or swap the movement before pushing progression.`,
      category: "recovery",
      id: "recovery-repeated-pain",
      lifecycle: createLifecycle({
        dismissalCooldownHours: 24,
        scope: "training_pattern",
        sourceExerciseIds: getPatternSourceExerciseIds(
          unresolvedPainExerciseLogs,
          (exerciseLog) => exerciseLog.badgeIds.includes("pain")
        ),
        stateKey: "repeated_pain",
      }),
      priority: 5,
      severity: "danger",
      surfaces: getRecoverySurfaces(
        unresolvedPainExerciseLogs,
        activeExerciseId,
        (exerciseLog) => exerciseLog.badgeIds.includes("pain"),
        2
      ),
      title: "Repeated pain signal",
    });
  } else if (painExerciseLabels.length === 1) {
    messages.push({
      body: `${formatExerciseList(
        painExerciseLabels
      )} was marked with pain. Consider reducing load or swapping the movement before pushing progression.`,
      category: "recovery",
      id: "recovery-pain-signal",
      lifecycle: createLifecycle({
        dismissalCooldownHours: 24,
        scope: "training_pattern",
        sourceExerciseIds: getPatternSourceExerciseIds(
          unresolvedPainExerciseLogs,
          (exerciseLog) => exerciseLog.badgeIds.includes("pain")
        ),
        stateKey: "pain_signal",
      }),
      priority: 10,
      severity: "warning",
      surfaces: getRecoverySurfaces(
        unresolvedPainExerciseLogs,
        activeExerciseId,
        (exerciseLog) => exerciseLog.badgeIds.includes("pain")
      ),
      title: "Pain signal noticed",
    });
  }

  if (formIssueLabels.length >= 2) {
    messages.push({
      body: `${formatExerciseList(
        formIssueLabels
      )} has repeated form flags. Repeat or reduce the load and make clean reps the goal before increasing.`,
      category: "recovery",
      id: "recovery-form-pattern",
      lifecycle: createLifecycle({
        dismissalCooldownHours: 24,
        scope: "training_pattern",
        sourceExerciseIds: getPatternSourceExerciseIds(
          unresolvedFormIssueExerciseLogs,
          (exerciseLog) => exerciseLog.badgeIds.includes("form_issue")
        ),
        stateKey: "form_pattern",
      }),
      priority: 15,
      severity: "warning",
      surfaces: getRecoverySurfaces(
        unresolvedFormIssueExerciseLogs,
        activeExerciseId,
        (exerciseLog) => exerciseLog.badgeIds.includes("form_issue"),
        2
      ),
      title: "Form pattern noticed",
    });
  }

  if (missedTargetLabels.length >= 2) {
    messages.push({
      body: `${formatExerciseList(
        missedTargetLabels
      )} has missed planned targets repeatedly. Hold the weight steady and earn the full rep target before adding load.`,
      category: "recovery",
      id: "recovery-missed-targets",
      lifecycle: createLifecycle({
        dismissalCooldownHours: 24,
        scope: "training_pattern",
        sourceExerciseIds: getPatternSourceExerciseIds(
          unresolvedMissedTargetExerciseLogs,
          (exerciseLog) =>
            hasMissedTargetSignal(exerciseLog) && !hasLoadTooHighSignal(exerciseLog)
        ),
        stateKey: "missed_targets",
      }),
      priority: 18,
      severity: "warning",
      surfaces: getRecoverySurfaces(
        unresolvedMissedTargetExerciseLogs,
        activeExerciseId,
        (exerciseLog) =>
          hasMissedTargetSignal(exerciseLog) && !hasLoadTooHighSignal(exerciseLog),
        2
      ),
      title: "Targets missed repeatedly",
    });
  }

  return messages;
};

const buildProgressionMessages = (
  sessions: WorkoutSessionDto[],
  exerciseHistoryScope?: ExerciseHistoryScopeOptions
): UserMessage[] => {
  const summary = buildProgressionSummary(sessions, exerciseHistoryScope);
  const readyCount = summary.readyToProgress.length;
  const repeatWeightCount = summary.repeatWeight.length;
  const holdSteadyCount = summary.holdSteady.length;
  const loadTooHighItems = summary.reduceOrModify.filter(
    (item) => item.signal === "load_too_high"
  );
  const reduceOrModifyCount = loadTooHighItems.length;
  const messages: UserMessage[] = [];

  if (readyCount > 0) {
    messages.push({
      action: {
        label: "View trends",
        to: "/trends",
      },
      body:
        readyCount === 1
          ? `${summary.readyToProgress[0].label} is ready for a smart next-step progression.`
          : `${readyCount} exercises are ready for smart next-step progression.`,
      category: "progressive_overload",
      id: "progression-ready",
      lifecycle: createLifecycle({
        dismissalCooldownHours: 168,
        scope: "exercise_action",
        sourceExerciseIds: summary.readyToProgress.map((item) => item.exerciseId),
        stateKey: "ready_to_progress",
      }),
      priority: 50,
      severity: "success",
      surfaces: ["dashboard", "workout_summary", "trends"],
      title: "Ready to progress",
    });
  }

  if (repeatWeightCount > 0) {
    messages.push({
      body:
        repeatWeightCount === 1
          ? `${summary.repeatWeight[0].label} was completed, but should be repeated for cleaner reps.`
          : `${formatExerciseList(
              summary.repeatWeight.map((item) => item.label)
            )} should repeat weight before increasing.`,
      category: "progressive_overload",
      id: "progression-repeat-weight",
      lifecycle: createLifecycle({
        dismissalCooldownHours: 168,
        scope: "exercise_action",
        sourceExerciseIds: summary.repeatWeight.map((item) => item.exerciseId),
        stateKey: "repeat_weight",
      }),
      priority: 55,
      severity: "info",
      surfaces: ["workout_summary", "trends"],
      title: "Repeat and clean it up",
    });
  }

  if (holdSteadyCount > 0) {
    messages.push({
      body:
        holdSteadyCount === 1
          ? `${summary.holdSteady[0].label} needs the same target again before increasing.`
          : `${formatExerciseList(
              summary.holdSteady.map((item) => item.label)
            )} should hold steady next time.`,
      category: "progressive_overload",
      id: "progression-hold-steady",
      lifecycle: createLifecycle({
        dismissalCooldownHours: 168,
        scope: "exercise_action",
        sourceExerciseIds: summary.holdSteady.map((item) => item.exerciseId),
        stateKey: "hold_steady",
      }),
      priority: 60,
      severity: "info",
      surfaces: ["workout_summary", "trends"],
      title: "Hold steady",
    });
  }

  if (reduceOrModifyCount > 0) {
    messages.push({
      body:
        reduceOrModifyCount === 1
          ? `${loadTooHighItems[0].label} looks too heavy or needs a safer variation next time.`
          : `${formatExerciseList(
              loadTooHighItems.map((item) => item.label)
            )} should be reduced or modified before pushing progression.`,
      category: "progressive_overload",
      id: "progression-reduce-or-modify",
      lifecycle: createLifecycle({
        dismissalCooldownHours: 24,
        scope: "exercise_action",
        sourceExerciseIds: loadTooHighItems.map((item) => item.exerciseId),
        stateKey: "load_too_high",
      }),
      priority: 45,
      severity: "warning",
      surfaces: ["dashboard", "workout_summary", "trends"],
      title: "Drop the load or modify",
    });
  }

  return messages;
};

const getPersonalRecordLabel = (record: PersonalRecord) => {
  switch (record.type) {
    case "heaviest_weight":
      return `${record.label} moved to ${record.value} ${record.weightUnit ?? ""}`.trim();
    case "most_reps_at_weight":
      return `${record.label} hit ${record.value} reps at the same weight`;
    case "highest_exercise_volume":
      return `${record.label} set a new volume high`;
    case "best_estimated_one_rep_max":
      return `${record.label} set a new estimated strength high`;
    default:
      return record.label;
  }
};

const buildPersonalRecordMessages = (
  sessions: WorkoutSessionDto[],
  recentlyCompletedSessionId?: string
): UserMessage[] => {
  if (!recentlyCompletedSessionId) {
    return [];
  }

  if (getLatestCompletedSession(sessions)?._id !== recentlyCompletedSessionId) {
    return [];
  }

  const records = getPersonalRecordsForSession(sessions, recentlyCompletedSessionId);

  if (records.length === 0) {
    return [];
  }

  const highlightedRecord = records[0];
  const remainingCount = records.length - 1;
  const remainingCopy =
    remainingCount > 0
      ? ` plus ${remainingCount} more ${remainingCount === 1 ? "record" : "records"}`
      : "";

  return [
    {
      body: `${getPersonalRecordLabel(highlightedRecord)}${remainingCopy}. This is an all-time compound-lift record.`,
      category: "personal_record",
      id: `personal-record-${recentlyCompletedSessionId}`,
      lifecycle: createLifecycle({
        dismissalCooldownHours: 168,
        scope: "latest_workout",
        sourceExerciseIds: records.map((record) => record.exerciseId),
        sourceSessionId: recentlyCompletedSessionId,
        stateKey: "personal_record",
      }),
      priority: 40,
      severity: "success",
      surfaces: ["workout_summary", "trends"],
      title: "New all-time personal record",
    },
  ];
};

export const buildUserMessages = ({
  activeExerciseId,
  currentProgramScope,
  exerciseHistoryScope,
  messagePreferences,
  now = new Date(),
  preview,
  recentlyCompletedSessionId,
  sessions,
}: BuildUserMessagesInput): UserMessage[] =>
  {
    const activeSessions = filterActiveWorkoutSessions(sessions);
    const currentProgramSessions = currentProgramScope
      ? filterCurrentProgramWorkoutSessions(activeSessions, currentProgramScope)
      : activeSessions;
    const referenceDate = getReferenceDate(activeSessions);

    return sortUserMessages(
      filterUserMessagesByPreferences(
        [
          buildCompletionMessage(activeSessions, recentlyCompletedSessionId),
          buildWeeklyCompletionMessage(
            currentProgramSessions,
            preview,
            referenceDate
          ),
          ...buildRecoveryMessages(activeSessions, referenceDate, activeExerciseId),
          ...buildPersonalRecordMessages(
            activeSessions,
            recentlyCompletedSessionId
          ),
          ...buildProgressionMessages(activeSessions, exerciseHistoryScope),
        ].filter((message): message is UserMessage => Boolean(message)),
        messagePreferences,
        now
      )
    );
  };
