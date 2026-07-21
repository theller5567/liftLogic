import type {
  WorkoutBadgeId,
  WorkoutExerciseLog,
  WorkoutSessionDto,
  WorkoutSetLog,
} from "../../../shared/types/workoutSession.types";
import type { WeightUnit } from "../../../shared/constants/weightEstimationRules";
import {
  filterExerciseHistoryWorkoutSessions,
  isWorkoutSessionInCurrentProgram,
  type ExerciseHistoryScopeOptions,
} from "../../../shared/utils/workoutSessionScope";
import { getStartOfWeek } from "./workoutSessionDates";

type WeightIncreaseAdvisoryInput = {
  exerciseLog: WorkoutExerciseLog;
  exerciseHistoryScope?: ExerciseHistoryScopeOptions;
  previousWeight?: number;
  nextWeight?: number;
  currentSession: WorkoutSessionDto;
  priorSessions: WorkoutSessionDto[];
};

export type ProgressiveOverloadState =
  | "no_history"
  | "ready_to_increase"
  | "repeat_weight"
  | "hold_steady"
  | "reduce_or_modify";

export type ActionableProgressiveOverloadState = Exclude<
  ProgressiveOverloadState,
  "no_history"
>;

export type ProgressiveOverloadRecommendation = {
  canApplyWeight: boolean;
  historySource?: "current_program" | "previous_program";
  previousWeight?: number;
  reason: string;
  recommendedWeight?: number;
  state: ProgressiveOverloadState;
  weightUnit?: WeightUnit;
};

type ProgressiveOverloadRecommendationInput = {
  currentSession: WorkoutSessionDto;
  exerciseHistoryScope?: ExerciseHistoryScopeOptions;
  exerciseLog: WorkoutExerciseLog;
  priorSessions: WorkoutSessionDto[];
  weightStep: number;
};

const REPEAT_WEIGHT_BADGES = new Set<WorkoutBadgeId>([
  "felt_hard",
  "form_issue",
]);

const HOLD_STEADY_BADGES = new Set<WorkoutBadgeId>(["missed_reps"]);

const LOAD_TOO_HIGH_SUPPORTING_BADGES = new Set<WorkoutBadgeId>([
  "felt_hard",
  "form_issue",
]);

const normalizeLabel = (label: string) =>
  label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");

export const getExerciseHistoryKey = (exerciseLog: WorkoutExerciseLog) =>
  exerciseLog.exerciseId ||
  exerciseLog.plannedExerciseId ||
  normalizeLabel(exerciseLog.label);

export const getProgressionTargetReps = (targetReps?: string) => {
  if (!targetReps) {
    return null;
  }

  const repValues = targetReps.match(/\d+/g)?.map(Number) ?? [];

  if (repValues.length === 0) {
    return null;
  }

  return Math.max(...repValues);
};

const weightsMatch = (left?: number, right?: number) =>
  left !== undefined && right !== undefined && Math.abs(left - right) < 0.001;

const getSetsAtWeight = (sets: WorkoutSetLog[], weight?: number) =>
  sets.filter((set) => weightsMatch(set.weight, weight));

const getSetTargetReps = (
  exerciseLog: WorkoutExerciseLog,
  setLog: WorkoutSetLog
) =>
  getProgressionTargetReps(setLog.targetReps) ??
  getProgressionTargetReps(exerciseLog.prescriptionSnapshot.reps);

const getMostRecentCompletedWeight = (exerciseLog: WorkoutExerciseLog) =>
  [...exerciseLog.sets].reverse().find((setLog) => setLog.completed)?.weight ??
  exerciseLog.prescriptionSnapshot.suggestedWeight;

const getMostRecentCompletedWeightUnit = (exerciseLog: WorkoutExerciseLog) =>
  [...exerciseLog.sets].reverse().find((setLog) => setLog.completed)?.weightUnit ??
  exerciseLog.prescriptionSnapshot.weightUnit;

const hasAnyBadge = (
  exerciseLog: WorkoutExerciseLog,
  badges: Set<WorkoutBadgeId>
) => exerciseLog.badgeIds.some((badgeId) => badges.has(badgeId));

const hasUsableWeightProgression = (
  previousWeight: number | undefined,
  weightUnit: WeightUnit | undefined
) => previousWeight !== undefined && previousWeight > 0 && Boolean(weightUnit);

const getRepTargetMissAnalysis = (exerciseLog: WorkoutExerciseLog) => {
  const requiredSetCount = exerciseLog.prescriptionSnapshot.sets;
  const requiredSets = exerciseLog.sets.slice(0, requiredSetCount);
  const attemptedSets = requiredSets.filter(
    (setLog) => setLog.completed && setLog.actualReps !== undefined
  );
  let missedSetCount = 0;
  let severeMissCount = 0;
  let largestRepMiss = 0;
  let totalCompletionRatio = 0;
  let comparableSetCount = 0;

  for (const setLog of attemptedSets) {
    const targetReps = getSetTargetReps(exerciseLog, setLog);

    if (targetReps === null || targetReps <= 0) {
      continue;
    }

    const actualReps = setLog.actualReps ?? 0;
    const repMiss = Math.max(0, targetReps - actualReps);

    comparableSetCount += 1;
    totalCompletionRatio += actualReps / targetReps;
    largestRepMiss = Math.max(largestRepMiss, repMiss);

    if (repMiss > 0) {
      missedSetCount += 1;
    }

    if (repMiss >= 2) {
      severeMissCount += 1;
    }
  }

  return {
    averageCompletionRatio:
      comparableSetCount > 0 ? totalCompletionRatio / comparableSetCount : 1,
    incompleteRequiredSetCount: Math.max(
      0,
      requiredSetCount - attemptedSets.length
    ),
    largestRepMiss,
    missedSetCount,
    severeMissCount,
  };
};

export const hasLoadTooHighSignal = (exerciseLog: WorkoutExerciseLog) => {
  const missedReps = exerciseLog.badgeIds.includes("missed_reps");
  const hasSupportingBadge = hasAnyBadge(
    exerciseLog,
    LOAD_TOO_HIGH_SUPPORTING_BADGES
  );
  const {
    averageCompletionRatio,
    incompleteRequiredSetCount,
    largestRepMiss,
    missedSetCount,
    severeMissCount,
  } = getRepTargetMissAnalysis(exerciseLog);

  return (
    (missedReps && hasSupportingBadge) ||
    (missedReps && incompleteRequiredSetCount > 0) ||
    severeMissCount >= 2 ||
    largestRepMiss >= 4 ||
    (missedSetCount >= 2 && averageCompletionRatio < 0.8)
  );
};

export const completedAllTargetSets = (exerciseLog: WorkoutExerciseLog) => {
  const requiredSetCount = exerciseLog.prescriptionSnapshot.sets;
  const completedSets = exerciseLog.sets.filter((setLog) => setLog.completed);

  if (completedSets.length < requiredSetCount) {
    return false;
  }

  return completedSets
    .slice(0, requiredSetCount)
    .every((setLog) => {
      const targetReps = getSetTargetReps(exerciseLog, setLog);

      return targetReps !== null && (setLog.actualReps ?? 0) >= targetReps;
    });
};

export const getCompletedExerciseProgressionState = (
  exerciseLog: WorkoutExerciseLog
): ActionableProgressiveOverloadState => {
  if (exerciseLog.badgeIds.includes("pain")) {
    return "reduce_or_modify";
  }

  if (hasLoadTooHighSignal(exerciseLog)) {
    return "reduce_or_modify";
  }

  if (
    hasAnyBadge(exerciseLog, HOLD_STEADY_BADGES) ||
    !completedAllTargetSets(exerciseLog)
  ) {
    return "hold_steady";
  }

  if (hasAnyBadge(exerciseLog, REPEAT_WEIGHT_BADGES)) {
    return "repeat_weight";
  }

  return "ready_to_increase";
};

const completedTargetAtWeight = (
  exerciseLog: WorkoutExerciseLog,
  weight?: number
) => {
  const targetReps = getProgressionTargetReps(
    exerciseLog.prescriptionSnapshot.reps
  );

  if (weight === undefined || targetReps === null) {
    return null;
  }

  const setsAtWeight = getSetsAtWeight(exerciseLog.sets, weight);
  const completedSetsAtWeight = setsAtWeight.filter((set) => set.completed);

  if (setsAtWeight.length === 0) {
    return null;
  }

  if (completedSetsAtWeight.length === 0) {
    return false;
  }

  const requiredSetCount = exerciseLog.prescriptionSnapshot.sets;
  const completedTargetSetCount = completedSetsAtWeight.filter(
    (set) => (set.actualReps ?? 0) >= targetReps
  ).length;

  return (
    completedSetsAtWeight.length >= requiredSetCount &&
    completedTargetSetCount >= requiredSetCount
  );
};

const sameExercise = (
  exerciseLog: WorkoutExerciseLog,
  candidateLog: WorkoutExerciseLog
) => getExerciseHistoryKey(exerciseLog) === getExerciseHistoryKey(candidateLog);

export const getMostRecentPriorWeekExerciseLog = (
  exerciseLog: WorkoutExerciseLog,
  currentSession: WorkoutSessionDto,
  priorSessions: WorkoutSessionDto[],
  exerciseHistoryScope: ExerciseHistoryScopeOptions = {}
) => {
  const currentWeekStart = getStartOfWeek(new Date(currentSession.scheduledFor));

  return filterExerciseHistoryWorkoutSessions([...priorSessions], {
    ...exerciseHistoryScope,
    exerciseId: exerciseLog.exerciseId,
  })
    .filter(
      (session) =>
        session.status === "completed" &&
        new Date(session.scheduledFor) < currentWeekStart
    )
    .sort(
      (left, right) =>
        new Date(right.scheduledFor).getTime() -
        new Date(left.scheduledFor).getTime()
    )
    .flatMap((session) => session.exerciseLogs)
    .find((candidateLog) => sameExercise(exerciseLog, candidateLog));
};

const getHistorySourceForExerciseLog = (
  priorExerciseLog: WorkoutExerciseLog,
  priorSessions: WorkoutSessionDto[],
  exerciseHistoryScope: ExerciseHistoryScopeOptions
): ProgressiveOverloadRecommendation["historySource"] => {
  if (!exerciseHistoryScope.currentProgramScope) {
    return undefined;
  }

  const sourceSession = priorSessions.find((session) =>
    session.exerciseLogs.includes(priorExerciseLog)
  );

  if (!sourceSession) {
    return undefined;
  }

  return isWorkoutSessionInCurrentProgram(
    sourceSession,
    exerciseHistoryScope.currentProgramScope
  )
    ? "current_program"
    : "previous_program";
};

export const shouldShowWeightIncreaseAdvisory = ({
  currentSession,
  exerciseHistoryScope,
  exerciseLog,
  nextWeight,
  previousWeight,
  priorSessions,
}: WeightIncreaseAdvisoryInput) => {
  if (
    previousWeight === undefined ||
    nextWeight === undefined ||
    nextWeight <= previousWeight
  ) {
    return false;
  }

  const priorExerciseLog = getMostRecentPriorWeekExerciseLog(
    exerciseLog,
    currentSession,
    priorSessions,
    exerciseHistoryScope
  );
  const sameSessionResult = completedTargetAtWeight(exerciseLog, previousWeight);
  const priorSessionResult = priorExerciseLog
    ? completedTargetAtWeight(priorExerciseLog, previousWeight)
    : null;

  if (sameSessionResult === true || priorSessionResult === true) {
    return false;
  }

  if (sameSessionResult === false) {
    return true;
  }

  return priorSessionResult === false;
};

export const getProgressiveOverloadRecommendation = ({
  currentSession,
  exerciseHistoryScope = {},
  exerciseLog,
  priorSessions,
  weightStep,
}: ProgressiveOverloadRecommendationInput): ProgressiveOverloadRecommendation => {
  const priorExerciseLog = getMostRecentPriorWeekExerciseLog(
    exerciseLog,
    currentSession,
    priorSessions,
    exerciseHistoryScope
  );

  if (!priorExerciseLog) {
    return {
      canApplyWeight: false,
      reason: "No previous completed workout found for this exercise yet.",
      state: "no_history",
    };
  }

  const previousWeight = getMostRecentCompletedWeight(priorExerciseLog);
  const weightUnit = getMostRecentCompletedWeightUnit(priorExerciseLog);
  const historySource = getHistorySourceForExerciseLog(
    priorExerciseLog,
    priorSessions,
    exerciseHistoryScope
  );
  const canApplyWeight = hasUsableWeightProgression(previousWeight, weightUnit);
  const progressionState =
    getCompletedExerciseProgressionState(priorExerciseLog);

  if (progressionState === "reduce_or_modify") {
    const shouldSuggestLowerWeight =
      !priorExerciseLog.badgeIds.includes("pain") &&
      hasLoadTooHighSignal(priorExerciseLog) &&
      canApplyWeight &&
      previousWeight !== undefined &&
      previousWeight > weightStep;
    const recommendedWeight = shouldSuggestLowerWeight
      ? previousWeight - weightStep
      : undefined;

    return {
      canApplyWeight: recommendedWeight !== undefined,
      historySource,
      previousWeight,
      reason: priorExerciseLog.badgeIds.includes("pain")
        ? "This exercise was marked with pain last time. Consider reducing load or swapping the movement."
        : recommendedWeight !== undefined
          ? `Last time suggests this load was too high. Drop ${weightStep} ${weightUnit} and rebuild with clean target reps.`
          : "Last time suggests this load was too high. Reduce the load, use a cleaner range of motion, or swap the movement.",
      recommendedWeight,
      state: "reduce_or_modify",
      weightUnit,
    };
  }

  if (progressionState === "hold_steady") {
    return {
      canApplyWeight: false,
      historySource,
      previousWeight,
      reason:
        "Stay at this weight until you complete every planned set and rep.",
      state: "hold_steady",
      weightUnit,
    };
  }

  if (progressionState === "repeat_weight") {
    return {
      canApplyWeight: false,
      historySource,
      previousWeight,
      reason:
        "You finished the work, but it was marked hard or form-limited. Repeat this weight and make it cleaner.",
      state: "repeat_weight",
      weightUnit,
    };
  }

  if (!canApplyWeight || previousWeight === undefined) {
    return {
      canApplyWeight: false,
      historySource,
      previousWeight,
      reason:
        "You completed the target last time. Progress this exercise with cleaner reps, more control, or a slightly harder variation.",
      state: "ready_to_increase",
      weightUnit,
    };
  }

  const recommendedWeight = previousWeight + weightStep;

  return {
    canApplyWeight: true,
    historySource,
    previousWeight,
    reason: `You completed every target rep last time. Try ${weightStep} ${weightUnit} more today.`,
    recommendedWeight,
    state: "ready_to_increase",
    weightUnit,
  };
};
