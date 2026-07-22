import type {
  WorkoutBadgeId,
  WorkoutExerciseLog,
  WorkoutSessionDto,
  WorkoutSetLog,
} from "../../../shared/types/workoutSession.types";
import {
  weightEstimationRules,
  type WeightUnit,
} from "../../../shared/constants/weightEstimationRules";
import { normalizeLibraryIdToEstimatorKey } from "../../../shared/utils/exerciseLibraryAdapter";
import {
  getLoadFeasibility,
  parsePrescriptionTopReps,
} from "../../../shared/utils/loadFeasibility";
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

export const getProgressionMinimumTargetReps = (targetReps?: string) => {
  if (!targetReps) {
    return null;
  }

  const repValues = targetReps.match(/\d+/g)?.map(Number) ?? [];

  if (repValues.length === 0) {
    return null;
  }

  return Math.min(...repValues);
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

const getSetMinimumTargetReps = (
  exerciseLog: WorkoutExerciseLog,
  setLog: WorkoutSetLog
) =>
  getProgressionMinimumTargetReps(setLog.targetReps) ??
  getProgressionMinimumTargetReps(exerciseLog.prescriptionSnapshot.reps);

const getMostRecentCompletedWeight = (exerciseLog: WorkoutExerciseLog) =>
  [...exerciseLog.sets].reverse().find((setLog) => setLog.completed)?.weight ??
  exerciseLog.prescriptionSnapshot.suggestedWeight;

const getMostRecentCompletedWeightUnit = (exerciseLog: WorkoutExerciseLog) =>
  [...exerciseLog.sets].reverse().find((setLog) => setLog.completed)?.weightUnit ??
  exerciseLog.prescriptionSnapshot.weightUnit;

const getAttemptedReps = (exerciseLog: WorkoutExerciseLog) =>
  exerciseLog.sets
    .slice(0, exerciseLog.prescriptionSnapshot.sets)
    .filter((setLog) => setLog.completed && setLog.actualReps !== undefined)
    .map((setLog) => setLog.actualReps ?? 0);

const getCompletedVolumeBackedOneRepMax = (exerciseLog: WorkoutExerciseLog) => {
  const targetReps = getProgressionTargetReps(
    exerciseLog.prescriptionSnapshot.reps
  );

  if (!targetReps) {
    return null;
  }

  const requiredSetCount = exerciseLog.prescriptionSnapshot.sets;
  const completedSets = exerciseLog.sets
    .filter(
      (setLog) =>
        setLog.completed &&
        setLog.weight !== undefined &&
        setLog.weight > 0 &&
        (setLog.actualReps ?? 0) >= targetReps
    )
    .slice(0, requiredSetCount);

  if (completedSets.length < requiredSetCount) {
    return null;
  }

  const heaviestCompletedWeight = Math.max(
    ...completedSets.map((setLog) => setLog.weight ?? 0)
  );
  const fatigueMultiplier = Math.max(
    0,
    1 - Math.max(0, requiredSetCount - 1) * 0.015
  );

  if (fatigueMultiplier <= 0) {
    return null;
  }

  return (heaviestCompletedWeight / fatigueMultiplier) * (1 + targetReps / 30);
};

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
  let setsAtOrAboveMinimum = 0;
  let setsBelowMinimum = 0;
  let severeMinimumMissCount = 0;
  let largestMinimumRepMiss = 0;
  let totalMinimumCompletionRatio = 0;
  let comparableMinimumSetCount = 0;

  for (const setLog of attemptedSets) {
    const targetReps = getSetTargetReps(exerciseLog, setLog);
    const minimumTargetReps = getSetMinimumTargetReps(exerciseLog, setLog);
    const actualReps = setLog.actualReps ?? 0;

    if (targetReps === null || targetReps <= 0) {
      if (minimumTargetReps === null || minimumTargetReps <= 0) {
        continue;
      }
    } else {
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

    if (minimumTargetReps !== null && minimumTargetReps > 0) {
      const minimumRepMiss = Math.max(0, minimumTargetReps - actualReps);

      comparableMinimumSetCount += 1;
      totalMinimumCompletionRatio += actualReps / minimumTargetReps;
      largestMinimumRepMiss = Math.max(largestMinimumRepMiss, minimumRepMiss);

      if (actualReps >= minimumTargetReps) {
        setsAtOrAboveMinimum += 1;
      } else {
        setsBelowMinimum += 1;
      }

      if (minimumRepMiss >= 3) {
        severeMinimumMissCount += 1;
      }
    }
  }

  return {
    averageCompletionRatio:
      comparableSetCount > 0 ? totalCompletionRatio / comparableSetCount : 1,
    averageMinimumCompletionRatio:
      comparableMinimumSetCount > 0
        ? totalMinimumCompletionRatio / comparableMinimumSetCount
        : 1,
    incompleteRequiredSetCount: Math.max(
      0,
      requiredSetCount - attemptedSets.length
    ),
    largestMinimumRepMiss,
    largestRepMiss,
    missedSetCount,
    severeMinimumMissCount,
    severeMissCount,
    setsAtOrAboveMinimum,
    setsBelowMinimum,
  };
};

export const hasLoadTooHighSignal = (exerciseLog: WorkoutExerciseLog) => {
  const missedReps = exerciseLog.badgeIds.includes("missed_reps");
  const hasFormIssue = exerciseLog.badgeIds.includes("form_issue");
  const {
    averageMinimumCompletionRatio,
    incompleteRequiredSetCount,
    largestMinimumRepMiss,
    severeMinimumMissCount,
    setsAtOrAboveMinimum,
    setsBelowMinimum,
  } = getRepTargetMissAnalysis(exerciseLog);
  const completedEnoughSetsToJudge = incompleteRequiredSetCount === 0;
  const noSetsReachedRepRange =
    completedEnoughSetsToJudge && setsAtOrAboveMinimum === 0 && setsBelowMinimum > 0;
  const onlyOneSetReachedRangeThenCollapsed =
    completedEnoughSetsToJudge &&
    setsAtOrAboveMinimum <= 1 &&
    setsBelowMinimum >= 2 &&
    severeMinimumMissCount >= 2;
  const repeatedSevereMisses =
    completedEnoughSetsToJudge &&
    severeMinimumMissCount >= 2 &&
    averageMinimumCompletionRatio < 0.85;
  const majorRepeatedMiss =
    completedEnoughSetsToJudge &&
    largestMinimumRepMiss >= 4 &&
    setsBelowMinimum >= 2;

  return (
    noSetsReachedRepRange ||
    onlyOneSetReachedRangeThenCollapsed ||
    repeatedSevereMisses ||
    majorRepeatedMiss ||
    (missedReps && hasFormIssue && setsBelowMinimum >= 2)
  );
};

const hasForgivingFatiguePattern = (exerciseLog: WorkoutExerciseLog) => {
  const minTargetReps = getProgressionMinimumTargetReps(
    exerciseLog.prescriptionSnapshot.reps
  );
  const topTargetReps = getProgressionTargetReps(
    exerciseLog.prescriptionSnapshot.reps
  );
  const attemptedReps = getAttemptedReps(exerciseLog);

  if (
    minTargetReps === null ||
    topTargetReps === null ||
    attemptedReps.length < exerciseLog.prescriptionSnapshot.sets ||
    attemptedReps.length < 2
  ) {
    return false;
  }

  const belowMinimumCount = attemptedReps.filter(
    (reps) => reps < minTargetReps
  ).length;
  const lastSetReps = attemptedReps[attemptedReps.length - 1];
  const earlierSets = attemptedReps.slice(0, -1);
  const oneBadLastSet =
    belowMinimumCount === 1 &&
    lastSetReps < minTargetReps &&
    earlierSets.every((reps) => reps >= minTargetReps);
  const strongEarlySets = earlierSets.every(
    (reps) => reps >= topTargetReps - 2
  );

  return oneBadLastSet || strongEarlySets;
};

export const hasPrematureProgressionLoadSignal = (
  exerciseLog: WorkoutExerciseLog,
  previousExerciseLog?: WorkoutExerciseLog
) => {
  if (!previousExerciseLog || hasForgivingFatiguePattern(exerciseLog)) {
    return false;
  }

  const currentWeight = getMostRecentCompletedWeight(exerciseLog);
  const previousWeight = getMostRecentCompletedWeight(previousExerciseLog);
  const minimumTargetReps = getProgressionMinimumTargetReps(
    exerciseLog.prescriptionSnapshot.reps
  );
  const attemptedReps = getAttemptedReps(exerciseLog);

  if (
    currentWeight === undefined ||
    previousWeight === undefined ||
    currentWeight <= previousWeight ||
    minimumTargetReps === null ||
    attemptedReps.length < exerciseLog.prescriptionSnapshot.sets
  ) {
    return false;
  }

  const previousWeightWasEarned =
    completedTargetAtWeight(previousExerciseLog, previousWeight) === true;
  const belowMinimumCount = attemptedReps.filter(
    (reps) => reps < minimumTargetReps
  ).length;
  const firstSetMissedBadly = attemptedReps[0] < minimumTargetReps - 2;
  const averageMinimumCompletion =
    attemptedReps.reduce((total, reps) => total + reps / minimumTargetReps, 0) /
    attemptedReps.length;

  if (belowMinimumCount === 0) {
    return false;
  }

  if (!previousWeightWasEarned) {
    return belowMinimumCount >= 2 || firstSetMissedBadly;
  }

  return (
    firstSetMissedBadly ||
    (belowMinimumCount >= 2 && averageMinimumCompletion < 0.9)
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
  exerciseLog: WorkoutExerciseLog,
  previousExerciseLog?: WorkoutExerciseLog
): ActionableProgressiveOverloadState => {
  if (exerciseLog.badgeIds.includes("pain")) {
    return "reduce_or_modify";
  }

  if (
    hasLoadTooHighSignal(exerciseLog) ||
    hasPrematureProgressionLoadSignal(exerciseLog, previousExerciseLog)
  ) {
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

const getMostRecentEarlierExerciseLog = (
  exerciseLog: WorkoutExerciseLog,
  sessions: WorkoutSessionDto[],
  exerciseHistoryScope: ExerciseHistoryScopeOptions = {}
) => {
  const sourceSession = sessions.find((session) =>
    session.exerciseLogs.includes(exerciseLog)
  );

  if (!sourceSession) {
    return undefined;
  }

  const sourceTime = new Date(sourceSession.scheduledFor).getTime();

  return filterExerciseHistoryWorkoutSessions(sessions, {
    ...exerciseHistoryScope,
    exerciseId: exerciseLog.exerciseId,
  })
    .filter(
      (session) =>
        session.status === "completed" &&
        new Date(session.scheduledFor).getTime() < sourceTime
    )
    .sort(
      (left, right) =>
        new Date(right.scheduledFor).getTime() -
        new Date(left.scheduledFor).getTime()
    )
    .flatMap((session) => session.exerciseLogs)
    .find((candidateLog) => sameExercise(exerciseLog, candidateLog));
};

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

const getFeasibilityCheckedProgression = ({
  exerciseLog,
  priorExerciseLog,
  previousWeight,
  recommendedWeight,
  weightStep,
  weightUnit,
}: {
  exerciseLog: WorkoutExerciseLog;
  priorExerciseLog: WorkoutExerciseLog;
  previousWeight: number;
  recommendedWeight: number;
  weightStep: number;
  weightUnit: WeightUnit;
}) => {
  const exerciseKey = normalizeLibraryIdToEstimatorKey(exerciseLog.exerciseId);
  const oneRepMax = getCompletedVolumeBackedOneRepMax(priorExerciseLog);

  if (!exerciseKey || oneRepMax === null) {
    return {
      recommendedWeight,
      state: "ready_to_increase" as const,
    };
  }

  const equipmentType = weightEstimationRules.exerciseMeta[exerciseKey].equipmentType;
  const getFeasibility = (assignedWeight: number) =>
    getLoadFeasibility({
      assignedWeight,
      capacity: {
        oneRepMax,
        source: "recent_performance",
      },
      confidence: "high",
      equipmentType,
      reps: exerciseLog.prescriptionSnapshot.reps,
      sets: exerciseLog.prescriptionSnapshot.sets,
      weightUnit,
    });
  const recommendedFeasibility = getFeasibility(recommendedWeight);

  if (recommendedFeasibility.status !== "too_heavy") {
    return {
      recommendedWeight,
      state: "ready_to_increase" as const,
    };
  }

  const smallerIncrease = Number(
    (previousWeight + Math.max(weightStep / 4, 0)).toFixed(1)
  );

  if (smallerIncrease > previousWeight && smallerIncrease < recommendedWeight) {
    const smallerFeasibility = getFeasibility(smallerIncrease);

    if (smallerFeasibility.status !== "too_heavy") {
      return {
        recommendedWeight: smallerIncrease,
        reason: `You earned progress, but ${recommendedWeight} ${weightUnit} looks too aggressive for ${exerciseLog.prescriptionSnapshot.sets} sets of ${parsePrescriptionTopReps(exerciseLog.prescriptionSnapshot.reps) ?? exerciseLog.prescriptionSnapshot.reps}. Try a smaller increase first.`,
        state: "ready_to_increase" as const,
      };
    }
  }

  return {
    recommendedWeight: previousWeight,
    reason: `You earned progress, but the next jump looks too heavy for this prescription. Repeat ${previousWeight} ${weightUnit} and make it solid before increasing.`,
    state: "repeat_weight" as const,
  };
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
  const previousPriorExerciseLog = getMostRecentEarlierExerciseLog(
    priorExerciseLog,
    priorSessions,
    exerciseHistoryScope
  );
  const progressionState =
    getCompletedExerciseProgressionState(
      priorExerciseLog,
      previousPriorExerciseLog
    );

  if (progressionState === "reduce_or_modify") {
    const previousPriorWeight = previousPriorExerciseLog
      ? getMostRecentCompletedWeight(previousPriorExerciseLog)
      : undefined;
    const shouldSuggestLowerWeight =
      !priorExerciseLog.badgeIds.includes("pain") &&
      (hasLoadTooHighSignal(priorExerciseLog) ||
        hasPrematureProgressionLoadSignal(
          priorExerciseLog,
          previousPriorExerciseLog
        )) &&
      canApplyWeight &&
      previousWeight !== undefined &&
      previousWeight > weightStep;
    const recommendedWeight =
      shouldSuggestLowerWeight && previousPriorWeight !== undefined
        ? Math.min(previousPriorWeight, previousWeight - weightStep)
        : shouldSuggestLowerWeight
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

  if (!canApplyWeight || previousWeight === undefined || weightUnit === undefined) {
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

  const usableWeightUnit = weightUnit;
  const recommendedWeight = previousWeight + weightStep;
  const checkedProgression = getFeasibilityCheckedProgression({
    exerciseLog,
    priorExerciseLog,
    previousWeight,
    recommendedWeight,
    weightStep,
    weightUnit: usableWeightUnit,
  });

  return {
    canApplyWeight:
      checkedProgression.state === "ready_to_increase" &&
      checkedProgression.recommendedWeight > previousWeight,
    historySource,
    previousWeight,
    reason:
      checkedProgression.reason ??
      `You completed every target rep last time. Try ${weightStep} ${usableWeightUnit} more today.`,
    recommendedWeight: checkedProgression.recommendedWeight,
    state: checkedProgression.state,
    weightUnit: usableWeightUnit,
  };
};
