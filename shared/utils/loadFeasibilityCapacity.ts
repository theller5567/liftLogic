import {
  type ConfidenceLevel,
  type ExerciseKey,
  type ExperienceLevel,
  type WeightUnit,
  weightEstimationRules,
} from "../constants/weightEstimationRules";
import type { OnboardingAnswers } from "../types/onboarding.types";
import type {
  WorkoutExerciseLog,
  WorkoutSessionDto,
  WorkoutSetLog,
} from "../types/workoutSession.types";
import {
  type LoadFeasibilityCapacity,
  type LoadFeasibilitySource,
  estimateOneRepMax,
} from "./loadFeasibility";
import { onboardingAnchorDefinitions } from "./onboardingExerciseMapping";
import { getDefaultStartingWeight } from "./weightEstimation";
import { normalizeLibraryIdToEstimatorKey } from "./exerciseLibraryAdapter";

type AnchorAnswer = NonNullable<
  | OnboardingAnswers["benchPress"]
  | OnboardingAnswers["dumbbellRow"]
  | OnboardingAnswers["squat"]
  | OnboardingAnswers["barbellDeadlift"]
>;

type UsableAnchorAnswer = AnchorAnswer & {
  estimatedReps: number;
  estimatedWeight: number;
};

export type LoadFeasibilityCapacitySourceKind =
  | "recent_clean_log"
  | "onboarding_anchor"
  | "derived_onboarding_anchor"
  | "default_estimate"
  | "unknown";

export type LoadFeasibilityCapacityResult = {
  capacity?: LoadFeasibilityCapacity;
  canonicalEstimatorKey?: ExerciseKey;
  confidence: ConfidenceLevel;
  derivedFrom?: ExerciseKey;
  reason: string;
  source: LoadFeasibilitySource;
  sourceKind: LoadFeasibilityCapacitySourceKind;
};

export type ResolveLoadFeasibilityCapacityParams = {
  canonicalEstimatorKey?: ExerciseKey | null;
  exerciseId?: string;
  experienceLevel?: ExperienceLevel;
  includeDefaultEstimate?: boolean;
  onboardingAnswers?: OnboardingAnswers;
  workoutSessions?: WorkoutSessionDto[];
  weightUnit?: WeightUnit;
};

const getAnchorAnswer = (
  answers: OnboardingAnswers,
  anchor: (typeof onboardingAnchorDefinitions)[number]["anchor"]
): AnchorAnswer | undefined => {
  switch (anchor) {
    case "benchPress":
      return answers.benchPress;
    case "dumbbellRow":
      return answers.dumbbellRow;
    case "squat":
      return answers.squat;
    case "barbellDeadlift":
      return answers.barbellDeadlift;
    default:
      return undefined;
  }
};

const getUsableAnchorAnswer = (
  answers: OnboardingAnswers | undefined,
  exerciseKey: ExerciseKey
) => {
  if (!answers) {
    return undefined;
  }

  const anchorDefinition = onboardingAnchorDefinitions.find(
    (definition) => definition.canonicalExerciseKey === exerciseKey
  );

  if (!anchorDefinition) {
    return undefined;
  }

  const answer = getAnchorAnswer(answers, anchorDefinition.anchor);

  if (
    answer?.knowsWorkingWeight !== true ||
    answer.estimatedWeight === undefined ||
    answer.estimatedReps === undefined
  ) {
    return undefined;
  }

  return {
    answer: answer as UsableAnchorAnswer,
    anchor: anchorDefinition.anchor,
  };
};

const getSessionTime = (session: WorkoutSessionDto) =>
  new Date(session.completedAt ?? session.scheduledFor).getTime();

const isCleanExerciseLog = (exerciseLog: WorkoutExerciseLog) =>
  exerciseLog.completed &&
  !exerciseLog.badgeIds.includes("pain") &&
  !exerciseLog.badgeIds.includes("form_issue") &&
  !exerciseLog.badgeIds.includes("missed_reps");

const getMinimumTargetReps = (targetReps?: string) => {
  const repValues = targetReps?.match(/\d+/g)?.map(Number) ?? [];

  return repValues.length ? Math.min(...repValues) : undefined;
};

const isWeightedCompletedSet = (
  setLog: WorkoutSetLog
): setLog is WorkoutSetLog & { actualReps: number; weight: number } =>
  setLog.completed &&
  setLog.weight !== undefined &&
  setLog.weight > 0 &&
    setLog.actualReps !== undefined &&
    setLog.actualReps > 0;

const getBestSetCapacity = (sets: WorkoutSetLog[]) =>
  sets.reduce<LoadFeasibilityCapacity | undefined>((bestCapacity, setLog) => {
    if (!isWeightedCompletedSet(setLog)) {
      return bestCapacity;
    }

    const minimumTargetReps = getMinimumTargetReps(setLog.targetReps);

    if (
      minimumTargetReps !== undefined &&
      setLog.actualReps < minimumTargetReps
    ) {
      return bestCapacity;
    }

    const oneRepMax = estimateOneRepMax(setLog.weight, setLog.actualReps);

    if (oneRepMax === null) {
      return bestCapacity;
    }

    if (
      !bestCapacity ||
      ("oneRepMax" in bestCapacity && oneRepMax > bestCapacity.oneRepMax)
    ) {
      return {
        oneRepMax,
        source: "recent_performance",
      };
    }

    return bestCapacity;
  }, undefined);

const findRecentPerformanceCapacity = (
  workoutSessions: WorkoutSessionDto[] | undefined,
  exerciseId: string | undefined,
  exerciseKey: ExerciseKey | undefined
) => {
  if (!workoutSessions?.length || (!exerciseId && !exerciseKey)) {
    return undefined;
  }

  const sortedSessions = [...workoutSessions]
    .filter((session) => !session.deletedAt && session.status === "completed")
    .sort((left, right) => getSessionTime(right) - getSessionTime(left));

  for (const session of sortedSessions) {
    for (const exerciseLog of session.exerciseLogs) {
      const logEstimatorKey = normalizeLibraryIdToEstimatorKey(
        exerciseLog.exerciseId
      );
      const isMatch =
        (exerciseId !== undefined && exerciseLog.exerciseId === exerciseId) ||
        (exerciseKey !== undefined && logEstimatorKey === exerciseKey);

      if (!isMatch || !isCleanExerciseLog(exerciseLog)) {
        continue;
      }

      const capacity = getBestSetCapacity(exerciseLog.sets);

      if (capacity) {
        return capacity;
      }
    }
  }

  return undefined;
};

const getOnboardingCapacity = (
  answers: OnboardingAnswers | undefined,
  exerciseKey: ExerciseKey | undefined
): LoadFeasibilityCapacityResult | undefined => {
  if (!answers || !exerciseKey) {
    return undefined;
  }

  const directAnchor = getUsableAnchorAnswer(answers, exerciseKey);

  if (directAnchor) {
    return {
      capacity: {
        reps: directAnchor.answer.estimatedReps,
        source: "onboarding",
        weight: directAnchor.answer.estimatedWeight,
      },
      canonicalEstimatorKey: exerciseKey,
      confidence: directAnchor.answer.confidence ?? "medium",
      reason: `Estimated from your ${directAnchor.anchor} onboarding answer.`,
      source: "onboarding",
      sourceKind: "onboarding_anchor",
    };
  }

  const derivedRule =
    weightEstimationRules.derivedFrom[
      exerciseKey as keyof typeof weightEstimationRules.derivedFrom
    ];

  if (!derivedRule) {
    return undefined;
  }

  const sourceAnchor = getUsableAnchorAnswer(answers, derivedRule.source);

  if (!sourceAnchor) {
    return undefined;
  }

  return {
    capacity: {
      reps: sourceAnchor.answer.estimatedReps,
      source: "onboarding",
      weight: sourceAnchor.answer.estimatedWeight * derivedRule.multiplier,
    },
    canonicalEstimatorKey: exerciseKey,
    confidence: sourceAnchor.answer.confidence ?? "medium",
    derivedFrom: derivedRule.source,
    reason: `Estimated from your ${sourceAnchor.anchor} onboarding answer and adjusted for this exercise.`,
    source: "onboarding",
    sourceKind: "derived_onboarding_anchor",
  };
};

const getDefaultCapacity = ({
  exerciseKey,
  experienceLevel,
  weightUnit,
}: {
  exerciseKey: ExerciseKey | undefined;
  experienceLevel: ExperienceLevel | undefined;
  weightUnit: WeightUnit | undefined;
}): LoadFeasibilityCapacityResult | undefined => {
  if (!exerciseKey || !experienceLevel || !weightUnit) {
    return undefined;
  }

  return {
    capacity: {
      reps: 10,
      source: "default",
      weight: getDefaultStartingWeight({
        exerciseKey,
        experienceLevel,
        weightUnit,
      }),
    },
    canonicalEstimatorKey: exerciseKey,
    confidence: "low",
    reason: "Estimated from LiftLogic defaults because no user capacity is available yet.",
    source: "default",
    sourceKind: "default_estimate",
  };
};

export const resolveLoadFeasibilityCapacity = ({
  canonicalEstimatorKey,
  exerciseId,
  experienceLevel,
  includeDefaultEstimate = true,
  onboardingAnswers,
  workoutSessions,
  weightUnit,
}: ResolveLoadFeasibilityCapacityParams): LoadFeasibilityCapacityResult => {
  const exerciseKey =
    canonicalEstimatorKey ?? (exerciseId ? normalizeLibraryIdToEstimatorKey(exerciseId) : null);

  const recentPerformance = findRecentPerformanceCapacity(
    workoutSessions,
    exerciseId,
    exerciseKey ?? undefined
  );

  if (recentPerformance) {
    return {
      capacity: recentPerformance,
      canonicalEstimatorKey: exerciseKey ?? undefined,
      confidence: "high",
      reason: "Estimated from your most recent clean performance for this exercise.",
      source: "recent_performance",
      sourceKind: "recent_clean_log",
    };
  }

  const onboardingCapacity = getOnboardingCapacity(
    onboardingAnswers,
    exerciseKey ?? undefined
  );

  if (onboardingCapacity) {
    return onboardingCapacity;
  }

  const defaultCapacity = includeDefaultEstimate
    ? getDefaultCapacity({
        exerciseKey: exerciseKey ?? undefined,
        experienceLevel,
        weightUnit,
      })
    : undefined;

  if (defaultCapacity) {
    return defaultCapacity;
  }

  return {
    canonicalEstimatorKey: exerciseKey ?? undefined,
    confidence: "low",
    reason: "No reliable capacity source is available yet.",
    source: "unknown",
    sourceKind: "unknown",
  };
};
