import {
  equipmentLabelsById,
  type EquipmentItemId,
} from "../constants/equipmentCatalog";
import type {
  ExerciseDefinition,
  ExerciseDifficulty,
  MovementPattern,
  MuscleGroup,
} from "../constants/exercise-library";
import type { OnboardingAnswers } from "../types/onboarding.types";
import type { WorkoutFocusArea } from "../types/workoutFocus.types";
import { canPerformExercise } from "./equipmentRequirements";
import { getExerciseById } from "./exerciseLibraryAdapter";

export type ExerciseIntelligenceGoal = "hypertrophy" | "strength" | "hybrid";
export type ExerciseIntelligenceLevel = "beginner" | "intermediate" | "advanced";

const difficultyRank: Record<ExerciseIntelligenceLevel, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

const fallbackIsolationMovements = new Set<MovementPattern>([
  "calf_raise",
  "curl",
  "fly",
  "front_raise",
  "hip_abduction",
  "hip_adduction",
  "lateral_raise",
  "pullover",
  "scapular_control",
  "tibialis_raise",
  "triceps_extension",
  "triceps_pushdown",
  "trunk_flexion",
  "wrist_extension",
  "wrist_flexion",
]);

const coreMovementPatterns = new Set<MovementPattern>([
  "hinge",
  "horizontal_press",
  "horizontal_pull",
  "olympic_lift",
  "squat",
  "vertical_press",
  "vertical_pull",
]);

const titleCase = (value: string) =>
  value
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");

export function getExerciseDifficulty(
  exercise: ExerciseDefinition | null | undefined
): ExerciseDifficulty {
  return exercise?.difficulty ?? "intermediate";
}

export function isCompoundExercise(
  exercise: ExerciseDefinition | null | undefined
) {
  if (!exercise) {
    return false;
  }

  return exercise.isCompound ?? coreMovementPatterns.has(exercise.movementPattern);
}

export function isIsolationExercise(
  exercise: ExerciseDefinition | null | undefined
) {
  if (!exercise) {
    return false;
  }

  return exercise.isCompound !== undefined
    ? !exercise.isCompound
    : fallbackIsolationMovements.has(exercise.movementPattern);
}

export function isCoreCompoundExercise(
  exercise: ExerciseDefinition | null | undefined
) {
  return Boolean(
    exercise && isCompoundExercise(exercise) && coreMovementPatterns.has(exercise.movementPattern)
  );
}

export function getDifficultyFitScore(
  exercise: ExerciseDefinition | null | undefined,
  level: ExerciseIntelligenceLevel
) {
  if (!exercise) {
    return 0.5;
  }

  const difference = difficultyRank[getExerciseDifficulty(exercise)] - difficultyRank[level];

  if (difference <= 0) {
    return 1;
  }

  if (difference === 1) {
    return 0.55;
  }

  return 0.15;
}

export function isExerciseTooAdvancedForLevel(
  exercise: ExerciseDefinition | null | undefined,
  level: ExerciseIntelligenceLevel
) {
  return getExerciseDifficulty(exercise) === "advanced" && level !== "advanced";
}

export function getGoalFitScore(
  exercise: ExerciseDefinition | null | undefined,
  goal: ExerciseIntelligenceGoal
) {
  if (!exercise) {
    return 0.5;
  }

  const isCompound = isCompoundExercise(exercise);
  const isIsolation = isIsolationExercise(exercise);

  if (goal === "strength") {
    return isCompound ? 1 : 0.42;
  }

  if (goal === "hypertrophy") {
    return isIsolation ? 1 : 0.78;
  }

  return isCompound ? 0.95 : 0.82;
}

export function getFocusRelevanceScore(
  exercise: ExerciseDefinition | null | undefined,
  focusArea: WorkoutFocusArea
) {
  if (!exercise) {
    return 0;
  }

  const muscleScore = exercise.primaryMuscles.includes(focusArea)
    ? 4
    : exercise.secondaryMuscles.includes(focusArea)
      ? 2
      : 0;

  if (muscleScore === 0) {
    return 0;
  }

  return muscleScore + (isIsolationExercise(exercise) ? 1 : 0);
}

export function hasSharedPrimaryMuscle(
  left: ExerciseDefinition,
  right: ExerciseDefinition
) {
  return left.primaryMuscles.some((muscle) => right.primaryMuscles.includes(muscle));
}

export function getExerciseEquipmentFitScore(
  exercise: ExerciseDefinition | null | undefined,
  availableEquipment: EquipmentItemId[]
) {
  if (!exercise) {
    return 0.5;
  }

  return canPerformExercise(exercise.id, availableEquipment) ? 1 : 0;
}

export function getExerciseCompatibilityScore({
  availableEquipment,
  exercise,
  goal,
  level,
  targetExercise,
}: {
  availableEquipment: EquipmentItemId[];
  exercise: ExerciseDefinition;
  goal: ExerciseIntelligenceGoal;
  level: ExerciseIntelligenceLevel;
  targetExercise?: ExerciseDefinition | null;
}) {
  const equipmentScore = getExerciseEquipmentFitScore(exercise, availableEquipment);
  const difficultyScore = getDifficultyFitScore(exercise, level);
  const goalScore = getGoalFitScore(exercise, goal);
  const sameMovement = targetExercise?.movementPattern === exercise.movementPattern;
  const sameMuscle =
    targetExercise && hasSharedPrimaryMuscle(targetExercise, exercise);
  const sameLoadType =
    targetExercise?.loadType && exercise.loadType
      ? targetExercise.loadType === exercise.loadType
      : false;
  const sameTargetType =
    targetExercise?.targetType && exercise.targetType
      ? targetExercise.targetType === exercise.targetType
      : false;

  return (
    equipmentScore * 420 +
    (sameMuscle ? 180 : 0) +
    (sameMovement ? 120 : 0) +
    difficultyScore * 110 +
    goalScore * 90 +
    (sameLoadType ? 35 : 0) +
    (sameTargetType ? 25 : 0) -
    (isExerciseTooAdvancedForLevel(exercise, level) ? 90 : 0)
  );
}

export function getExerciseDetailTags(
  exercise: ExerciseDefinition | null | undefined
) {
  if (!exercise) {
    return [];
  }

  const equipmentLabel =
    exercise.primaryEquipment && exercise.primaryEquipment !== "other"
      ? titleCase(exercise.primaryEquipment)
      : titleCase(exercise.equipmentType);

  return [
    titleCase(getExerciseDifficulty(exercise)),
    isCompoundExercise(exercise) ? "Compound" : "Accessory",
    equipmentLabel,
  ];
}

export function getExerciseSelectionNotes({
  exercise,
  originalExercise,
}: {
  exercise: ExerciseDefinition | null | undefined;
  originalExercise?: ExerciseDefinition | null;
}) {
  if (!exercise || !originalExercise) {
    return [];
  }

  const notes: string[] = [];

  if (
    difficultyRank[getExerciseDifficulty(exercise)] <
    difficultyRank[getExerciseDifficulty(originalExercise)]
  ) {
    notes.push("Chosen as an easier alternative.");
  }

  if (hasSharedPrimaryMuscle(originalExercise, exercise)) {
    notes.push("Keeps the same primary training target.");
  }

  return notes;
}

export function getBestCompatibleAlternative({
  answers,
  availableEquipment,
  exerciseId,
}: {
  answers: OnboardingAnswers;
  availableEquipment: EquipmentItemId[];
  exerciseId: string;
}) {
  const originalExercise = getExerciseById(exerciseId);

  if (!originalExercise) {
    return null;
  }

  const level = answers.experienceLevel ?? "beginner";
  const goal = (answers.goalPriority ?? answers.goal ?? "hypertrophy") as ExerciseIntelligenceGoal;
  const candidates = originalExercise.alternatives
    .map((alternative) => ({
      alternative,
      exercise: getExerciseById(alternative.exerciseId),
    }))
    .filter(
      (candidate): candidate is {
        alternative: { exerciseId: string; note?: string };
        exercise: ExerciseDefinition;
      } =>
        Boolean(
          candidate.exercise &&
            canPerformExercise(candidate.exercise.id, availableEquipment)
        )
    )
    .sort(
      (left, right) =>
        getExerciseCompatibilityScore({
          availableEquipment,
          exercise: right.exercise,
          goal,
          level,
          targetExercise: originalExercise,
        }) -
        getExerciseCompatibilityScore({
          availableEquipment,
          exercise: left.exercise,
          goal,
          level,
          targetExercise: originalExercise,
        })
    );

  return candidates[0] ?? null;
}

export function summarizeExercisePool(
  exercises: ExerciseDefinition[],
  answers: OnboardingAnswers,
  availableEquipment: EquipmentItemId[]
) {
  if (exercises.length === 0) {
    return {
      accessoryRatio: 0,
      advancedRatio: 0,
      beginnerFriendlyRatio: 0,
      compoundRatio: 0,
      difficultyFitAverage: 0,
      equipmentFitRatio: 0,
      goalFitAverage: 0,
    };
  }

  const level = answers.experienceLevel ?? "beginner";
  const goal = (answers.goalPriority ?? answers.goal ?? "hypertrophy") as ExerciseIntelligenceGoal;
  const total = exercises.length;
  const sum = (values: number[]) =>
    values.reduce((current, value) => current + value, 0);

  return {
    accessoryRatio:
      exercises.filter((exercise) => isIsolationExercise(exercise)).length / total,
    advancedRatio:
      exercises.filter((exercise) => getExerciseDifficulty(exercise) === "advanced")
        .length / total,
    beginnerFriendlyRatio:
      exercises.filter(
        (exercise) => getExerciseDifficulty(exercise) !== "advanced"
      ).length / total,
    compoundRatio:
      exercises.filter((exercise) => isCompoundExercise(exercise)).length / total,
    difficultyFitAverage:
      sum(exercises.map((exercise) => getDifficultyFitScore(exercise, level))) /
      total,
    equipmentFitRatio:
      sum(
        exercises.map((exercise) =>
          getExerciseEquipmentFitScore(exercise, availableEquipment)
        )
      ) / total,
    goalFitAverage:
      sum(exercises.map((exercise) => getGoalFitScore(exercise, goal))) / total,
  };
}

export function getPrimaryMuscleLabels(muscles: MuscleGroup[]) {
  return muscles.map((muscle) => titleCase(muscle));
}

export function getEquipmentLabelsForItems(items: EquipmentItemId[]) {
  return items.map((item) => equipmentLabelsById[item]);
}
