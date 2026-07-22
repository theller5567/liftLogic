import type {
  UserMessageCategory,
  UserMessagePreferences,
  UserMessageSurface,
} from "../../../shared/types/userSettings.types";
import { DEFAULT_MESSAGE_PREFERENCES } from "../../../shared/types/userSettings.types";
import { weightEstimationRules } from "../../../shared/constants/weightEstimationRules";
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
import { normalizeLibraryIdToEstimatorKey } from "../../../shared/utils/exerciseLibraryAdapter";
import { getLoadFeasibility } from "../../../shared/utils/loadFeasibility";
import { resolveLoadFeasibilityCapacity } from "../../../shared/utils/loadFeasibilityCapacity";
import type { GeneratedWorkoutPreview } from "./generateWorkoutPreview";
import { getPersonalRecordsForSession, type PersonalRecord } from "./personalRecords";
import { buildProgressionSummary } from "./progressionSummary";
import { getEndOfWeek, getStartOfWeek } from "./workoutSessionDates";
import {
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

const getSuggestedWeightLabel = (weight: number, weightUnit: string) =>
  `${weight} ${weightUnit}`;

const getAssignedWeight = (exerciseLog: WorkoutExerciseLog) =>
  exerciseLog.prescriptionSnapshot.suggestedWeight ??
  exerciseLog.sets.find((setLog) => setLog.weight !== undefined)?.weight;

const getFeasibilityForExerciseLogEntry = ({
  entry,
  sessions,
}: {
  entry: CompletedExerciseLogEntry;
  sessions: WorkoutSessionDto[];
}) => {
  const exerciseLog = entry.exerciseLog;
  const canonicalEstimatorKey = normalizeLibraryIdToEstimatorKey(
    exerciseLog.exerciseId
  );

  if (!canonicalEstimatorKey) {
    return null;
  }

  const assignedWeight = getAssignedWeight(exerciseLog);
  const weightUnit = exerciseLog.prescriptionSnapshot.weightUnit;

  if (!assignedWeight || !weightUnit) {
    return null;
  }

  const priorSessions = sessions.filter(
    (session) => session.status === "completed" && getSessionTime(session) < entry.time
  );
  const capacity = resolveLoadFeasibilityCapacity({
    canonicalEstimatorKey,
    exerciseId: exerciseLog.exerciseId,
    includeDefaultEstimate: false,
    weightUnit,
    workoutSessions: priorSessions,
  });

  if (!capacity.capacity) {
    return null;
  }

  return getLoadFeasibility({
    assignedWeight,
    capacity: capacity.capacity,
    confidence: capacity.confidence,
    equipmentType:
      weightEstimationRules.exerciseMeta[canonicalEstimatorKey].equipmentType,
    reps: exerciseLog.prescriptionSnapshot.reps,
    sets: exerciseLog.prescriptionSnapshot.sets,
    weightUnit,
  });
};

const getFeasibleLoadSuggestion = ({
  exerciseId,
  sessions,
}: {
  exerciseId: string;
  sessions: WorkoutSessionDto[];
}) => {
  const sourceEntry = getCompletedExerciseLogEntries(sessions)
    .filter(
      (entry) =>
        entry.exerciseLog.exerciseId === exerciseId &&
        hasLoadTooHighSignal(entry.exerciseLog)
    )
    .sort((left, right) => right.time - left.time)[0];

  if (!sourceEntry) {
    return null;
  }

  const result = getFeasibilityForExerciseLogEntry({
    entry: sourceEntry,
    sessions,
  });

  if (
    !result ||
    result.suggestedWeight === undefined ||
    result.status === "unknown" ||
    result.suggestedWeight >= (result.assignedWeight ?? 0)
  ) {
    return null;
  }

  return {
    label: sourceEntry.exerciseLog.label,
    weightLabel: getSuggestedWeightLabel(
      result.suggestedWeight,
      sourceEntry.exerciseLog.prescriptionSnapshot.weightUnit ?? "lb"
    ),
  };
};

const getReduceOrModifyMessageBody = ({
  items,
  sessions,
}: {
  items: { exerciseId: string; label: string }[];
  sessions: WorkoutSessionDto[];
}) => {
  const suggestions = items
    .map((item) => getFeasibleLoadSuggestion({ exerciseId: item.exerciseId, sessions }))
    .filter((suggestion): suggestion is NonNullable<typeof suggestion> =>
      Boolean(suggestion)
    );

  if (items.length === 1) {
    const suggestion = suggestions[0];

    return suggestion
      ? `${items[0].label} is missing the target range across most sets. Try ${suggestion.weightLabel} next time or choose an easier variation if reps still break down.`
      : `${items[0].label} is missing the target range across most sets. Drop the load or choose an easier variation next time.`;
  }

  if (suggestions.length > 0) {
    const suggestionText = suggestions
      .slice(0, 2)
      .map((suggestion) => `${suggestion.label}: ${suggestion.weightLabel}`)
      .join(", ");

    return `A few lifts are missing the target range across most sets. Review the loads before progressing. Suggested targets: ${suggestionText}.`;
  }

  return "A few lifts are missing the target range across most sets. Review the loads before progressing.";
};

const getSignalLabels = (
  exerciseLogs: WorkoutExerciseLog[],
  predicate: (exerciseLog: WorkoutExerciseLog) => boolean
) => exerciseLogs.filter(predicate).map((exerciseLog) => exerciseLog.label);

type LoadSelectionPatternEntry = {
  entry: CompletedExerciseLogEntry;
  suggestedWeightLabel: string;
};

const isFeasibilityLoadSelectionSignal = (
  entry: CompletedExerciseLogEntry,
  sessions: WorkoutSessionDto[]
): LoadSelectionPatternEntry | null => {
  if (!hasLoadTooHighSignal(entry.exerciseLog)) {
    return null;
  }

  const feasibility = getFeasibilityForExerciseLogEntry({ entry, sessions });

  if (
    !feasibility ||
    feasibility.status !== "too_heavy" ||
    feasibility.suggestedWeight === undefined
  ) {
    return null;
  }

  return {
    entry,
    suggestedWeightLabel: getSuggestedWeightLabel(
      feasibility.suggestedWeight,
      entry.exerciseLog.prescriptionSnapshot.weightUnit ?? "lb"
    ),
  };
};

const getUnresolvedLoadSelectionPatternEntries = (
  sessions: WorkoutSessionDto[]
) => {
  const completedEntries = getCompletedExerciseLogEntries(sessions);
  const latestEntryByExercise = new Map<string, CompletedExerciseLogEntry>();
  const signalsByExercise = new Map<string, LoadSelectionPatternEntry[]>();

  for (const entry of completedEntries) {
    const current = latestEntryByExercise.get(entry.exerciseLog.exerciseId);

    if (!current || entry.time > current.time) {
      latestEntryByExercise.set(entry.exerciseLog.exerciseId, entry);
    }
  }

  const unresolvedSignals = completedEntries
    .map((entry) => isFeasibilityLoadSelectionSignal(entry, sessions))
    .filter((signal): signal is LoadSelectionPatternEntry => Boolean(signal))
    .filter((signal) => {
      const latest = latestEntryByExercise.get(
        signal.entry.exerciseLog.exerciseId
      );

      return Boolean(
        latest && isFeasibilityLoadSelectionSignal(latest, sessions)
      );
    });

  for (const signal of unresolvedSignals) {
    const exerciseId = signal.entry.exerciseLog.exerciseId;
    signalsByExercise.set(exerciseId, [
      ...(signalsByExercise.get(exerciseId) ?? []),
      signal,
    ]);
  }

  return [...signalsByExercise.values()]
    .filter((signals) => signals.length >= 2)
    .map((signals) => signals.sort((left, right) => right.entry.time - left.entry.time)[0]);
};

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
  const unresolvedPainExerciseLogs = getUnresolvedSignalExerciseLogs(
    recoveryWindowSessions,
    (exerciseLog) => exerciseLog.badgeIds.includes("pain")
  );
  const unresolvedFormIssueExerciseLogs = getUnresolvedSignalExerciseLogs(
    recoveryWindowSessions,
    (exerciseLog) => exerciseLog.badgeIds.includes("form_issue")
  );
  const unresolvedLoadSelectionPatternEntries =
    getUnresolvedLoadSelectionPatternEntries(recoveryWindowSessions);
  const loadSelectionExerciseIds = new Set(
    unresolvedLoadSelectionPatternEntries.map(
      ({ entry }) => entry.exerciseLog.exerciseId
    )
  );
  const painExerciseLabels = getSignalLabels(
    unresolvedPainExerciseLogs,
    (exerciseLog) => exerciseLog.badgeIds.includes("pain")
  );
  const formIssueLabels = getSignalLabels(
    unresolvedFormIssueExerciseLogs,
    (exerciseLog) => exerciseLog.badgeIds.includes("form_issue")
  );
  const loadSelectionLabels = unresolvedLoadSelectionPatternEntries.map(
    ({ entry }) => entry.exerciseLog.label
  );
  const loadSelectionSuggestion =
    unresolvedLoadSelectionPatternEntries.find(
      ({ suggestedWeightLabel }) => suggestedWeightLabel
    ) ?? null;
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
      )} has repeated form flags. Use a cleaner load or a safer variation before increasing.`,
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

  if (unresolvedLoadSelectionPatternEntries.length > 0) {
    messages.push({
      body: loadSelectionSuggestion?.suggestedWeightLabel
        ? loadSelectionLabels.length === 1
          ? `${loadSelectionLabels[0]} is missing the target range across most sets at a load above estimated capacity. Try ${loadSelectionSuggestion.suggestedWeightLabel} next time or choose an easier variation.`
          : `A few lifts are missing the target range across most sets. Review the loads before progressing. Try ${loadSelectionSuggestion.suggestedWeightLabel} for ${loadSelectionSuggestion.entry.exerciseLog.label}.`
        : loadSelectionLabels.length === 1
          ? `${loadSelectionLabels[0]} is missing the target range across most sets. Drop the load or choose an easier variation next time.`
          : "A few lifts are missing the target range across most sets. Review the loads before progressing.",
      category: "recovery",
      id: "recovery-load-selection-pattern",
      lifecycle: createLifecycle({
        dismissalCooldownHours: 24,
        scope: "training_pattern",
        sourceExerciseIds: getSourceExerciseIds(
          unresolvedLoadSelectionPatternEntries.map(({ entry }) => entry.exerciseLog)
        ),
        stateKey: "load_selection_pattern",
      }),
      priority: 16,
      severity: "warning",
      surfaces: getRecoverySurfaces(
        unresolvedLoadSelectionPatternEntries.map(({ entry }) => entry.exerciseLog),
        activeExerciseId,
        (exerciseLog) => loadSelectionExerciseIds.has(exerciseLog.exerciseId)
      ),
      title: "Review load selection",
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

  if (reduceOrModifyCount > 0) {
    messages.push({
      action: {
        label: "Review plan weights",
        to: "/plan",
      },
      body: getReduceOrModifyMessageBody({
        items: loadTooHighItems,
        sessions,
      }),
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
    const messageHistorySessions = currentProgramScope
      ? currentProgramSessions
      : activeSessions;
    const progressionSessions = currentProgramScope
      ? currentProgramSessions
      : activeSessions;
    const progressionHistoryScope =
      exerciseHistoryScope ??
      (currentProgramScope
        ? {
            currentProgramScope,
            includePreviousPrograms: false,
          }
        : undefined);
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
          ...buildRecoveryMessages(
            messageHistorySessions,
            referenceDate,
            activeExerciseId
          ),
          ...buildPersonalRecordMessages(
            activeSessions,
            recentlyCompletedSessionId
          ),
          ...buildProgressionMessages(
            progressionSessions,
            progressionHistoryScope
          ),
        ].filter((message): message is UserMessage => Boolean(message)),
        messagePreferences,
        now
      )
    );
  };
