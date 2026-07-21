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
import {
  completedAllTargetSets,
  hasLoadTooHighSignal,
} from "./workoutAdvisory";

export type UserMessageSeverity = "info" | "success" | "warning" | "danger";

export type UserMessageAction = {
  label: string;
  to?: string;
};

export type UserMessage = {
  id: string;
  category: UserMessageCategory;
  severity: UserMessageSeverity;
  priority: number;
  title: string;
  body: string;
  surfaces: UserMessageSurface[];
  action?: UserMessageAction;
};

export type BuildUserMessagesInput = {
  preview?: Pick<GeneratedWorkoutPreview, "days"> | null;
  sessions: WorkoutSessionDto[];
  currentProgramScope?: CurrentProgramScope;
  exerciseHistoryScope?: ExerciseHistoryScopeOptions;
  recentlyCompletedSessionId?: string;
  activeExerciseId?: string;
  messagePreferences?: UserMessagePreferences;
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
  preferences: UserMessagePreferences
) => {
  const isProtected = isProtectedPreferenceMessage(message);

  if (!preferences.categories[message.category] && !isProtected) {
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
  preferences?: UserMessagePreferences
) => {
  const mergedPreferences = getMergedMessagePreferences(preferences);

  return messages
    .filter((message) =>
      shouldShowForMessagePreferences(message, mergedPreferences)
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
    priority: 30,
    severity: "success",
    surfaces: ["workout_summary"],
    title: "Workout complete",
  };
};

const buildWeeklyCompletionMessage = (
  sessions: WorkoutSessionDto[],
  preview?: Pick<GeneratedWorkoutPreview, "days"> | null
): UserMessage | null => {
  const plannedWorkoutIds = new Set(preview?.days.map((day) => day.id) ?? []);
  const plannedWorkoutCount = plannedWorkoutIds.size;

  if (plannedWorkoutCount === 0) {
    return null;
  }

  const completedSessions = sessions.filter(
    (session) => session.status === "completed"
  );
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
    priority: 30,
    severity: "success",
    surfaces: ["dashboard"],
    title: "Weekly target complete",
  };
};

const getCompletedExerciseLogs = (sessions: WorkoutSessionDto[]) =>
  sessions
    .filter((session) => session.status === "completed")
    .flatMap((session) => session.exerciseLogs);

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
  activeExerciseId?: string
): UserMessage[] => {
  const exerciseLogs = getCompletedExerciseLogs(sessions);
  const painExerciseLabels = getSignalLabels(exerciseLogs, (exerciseLog) =>
    exerciseLog.badgeIds.includes("pain")
  );
  const formIssueLabels = getSignalLabels(exerciseLogs, (exerciseLog) =>
    exerciseLog.badgeIds.includes("form_issue")
  );
  const missedTargetLabels = getSignalLabels(
    exerciseLogs,
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
      priority: 5,
      severity: "danger",
      surfaces: getRecoverySurfaces(
        exerciseLogs,
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
      priority: 10,
      severity: "warning",
      surfaces: getRecoverySurfaces(
        exerciseLogs,
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
      priority: 15,
      severity: "warning",
      surfaces: getRecoverySurfaces(
        exerciseLogs,
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
      priority: 18,
      severity: "warning",
      surfaces: getRecoverySurfaces(
        exerciseLogs,
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
  preview,
  recentlyCompletedSessionId,
  sessions,
}: BuildUserMessagesInput): UserMessage[] =>
  {
    const activeSessions = filterActiveWorkoutSessions(sessions);
    const currentProgramSessions = currentProgramScope
      ? filterCurrentProgramWorkoutSessions(activeSessions, currentProgramScope)
      : activeSessions;

    return sortUserMessages(
      filterUserMessagesByPreferences(
        [
          buildCompletionMessage(activeSessions, recentlyCompletedSessionId),
          buildWeeklyCompletionMessage(currentProgramSessions, preview),
          ...buildRecoveryMessages(activeSessions, activeExerciseId),
          ...buildPersonalRecordMessages(
            activeSessions,
            recentlyCompletedSessionId
          ),
          ...buildProgressionMessages(activeSessions, exerciseHistoryScope),
        ].filter((message): message is UserMessage => Boolean(message)),
        messagePreferences
      )
    );
  };
