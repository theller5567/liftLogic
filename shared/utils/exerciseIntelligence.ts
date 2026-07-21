import {
  equipmentLabelsById,
  type EquipmentItemId,
} from "../constants/equipmentCatalog";
import type {
  ExerciseDefinition,
  ExerciseDifficulty,
  ExerciseImpactLevel,
  ExerciseJointConcern,
  ExerciseMetadataLevel,
  MovementPattern,
  MuscleGroup,
} from "../constants/exercise-library";
import { exerciseLibrary } from "../constants/exercise-library";
import type { OnboardingAnswers } from "../types/onboarding.types";
import type { WorkoutFocusArea } from "../types/workoutFocus.types";
import { canPerformExercise } from "./equipmentRequirements";
import { getExerciseById } from "./exerciseLibraryAdapter";

export type ExerciseIntelligenceGoal = "hypertrophy" | "strength" | "hybrid";
export type ExerciseIntelligenceLevel = "beginner" | "intermediate" | "advanced";
export type ExerciseMetadata = {
  recoveryCost: ExerciseMetadataLevel;
  technicalComplexity: ExerciseMetadataLevel;
  jointStress: ExerciseMetadataLevel;
  impactLevel: ExerciseImpactLevel;
  setupComplexity: ExerciseMetadataLevel;
  timeCost: "short" | "moderate" | "long";
  bestForGoals: ("hypertrophy" | "strength" | "hybrid" | "conditioning" | "skill")[];
  avoidIfJointConcern: ExerciseJointConcern[];
};

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

const highTechnicalPatterns = new Set<MovementPattern>([
  "get_up",
  "olympic_lift",
]);

const moderateTechnicalPatterns = new Set<MovementPattern>([
  "hinge",
  "jump",
  "lunge",
  "rotation",
  "squat",
  "step_up",
  "vertical_press",
]);

const highImpactPatterns = new Set<MovementPattern>(["jump"]);

const moderateImpactPatterns = new Set<MovementPattern>([
  "conditioning",
  "sled",
]);

const shoulderConcernPatterns = new Set<MovementPattern>([
  "fly",
  "horizontal_press",
  "lateral_raise",
  "olympic_lift",
  "pullover",
  "push_up",
  "scapular_control",
  "triceps_extension",
  "vertical_press",
]);

const elbowConcernPatterns = new Set<MovementPattern>([
  "curl",
  "push_up",
  "triceps_extension",
  "triceps_pushdown",
]);

const wristConcernPatterns = new Set<MovementPattern>([
  "front_raise",
  "get_up",
  "olympic_lift",
  "push_up",
  "wrist_extension",
  "wrist_flexion",
]);

const lowerBackConcernPatterns = new Set<MovementPattern>([
  "carry",
  "hinge",
  "horizontal_pull",
  "olympic_lift",
  "squat",
]);

const hipConcernPatterns = new Set<MovementPattern>([
  "get_up",
  "hinge",
  "hip_abduction",
  "hip_adduction",
  "hip_extension",
  "hip_thrust",
  "lunge",
  "squat",
  "step_up",
]);

const kneeConcernPatterns = new Set<MovementPattern>([
  "jump",
  "lunge",
  "sled",
  "squat",
  "step_up",
]);

const ankleConcernPatterns = new Set<MovementPattern>([
  "calf_raise",
  "jump",
  "lunge",
  "squat",
  "step_up",
  "tibialis_raise",
]);

const levelValue: Record<ExerciseMetadataLevel, number> = {
  low: 1,
  moderate: 2,
  high: 3,
};

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

function getDerivedRecoveryCost(exercise: ExerciseDefinition): ExerciseMetadataLevel {
  if (exercise.recoveryCost) {
    return exercise.recoveryCost;
  }

  if (
    exercise.movementPattern === "olympic_lift" ||
    (isCompoundExercise(exercise) &&
      exercise.primaryMuscles.some((muscle) =>
        ["glutes", "hamstrings", "quadriceps", "lower_back"].includes(muscle)
      ))
  ) {
    return "high";
  }

  if (isCompoundExercise(exercise) || exercise.targetType === "distance") {
    return "moderate";
  }

  return "low";
}

function getDerivedTechnicalComplexity(
  exercise: ExerciseDefinition
): ExerciseMetadataLevel {
  if (exercise.technicalComplexity) {
    return exercise.technicalComplexity;
  }

  if (
    exercise.difficulty === "advanced" ||
    highTechnicalPatterns.has(exercise.movementPattern)
  ) {
    return "high";
  }

  if (
    exercise.laterality === "unilateral" ||
    moderateTechnicalPatterns.has(exercise.movementPattern)
  ) {
    return "moderate";
  }

  return "low";
}

function getDerivedImpactLevel(exercise: ExerciseDefinition): ExerciseImpactLevel {
  if (exercise.impactLevel) {
    return exercise.impactLevel;
  }

  if (highImpactPatterns.has(exercise.movementPattern)) {
    return "high";
  }

  if (moderateImpactPatterns.has(exercise.movementPattern)) {
    return "moderate";
  }

  if (exercise.targetType === "time" || exercise.movementPattern === "isometric_hold") {
    return "none";
  }

  return "low";
}

function getDerivedSetupComplexity(
  exercise: ExerciseDefinition
): ExerciseMetadataLevel {
  if (exercise.setupComplexity) {
    return exercise.setupComplexity;
  }

  if (
    exercise.movementPattern === "olympic_lift" ||
    exercise.equipmentType === "barbell" ||
    exercise.equipmentType === "mixed"
  ) {
    return "high";
  }

  if (
    exercise.equipmentType === "cable" ||
    exercise.equipmentType === "machine" ||
    exercise.equipmentType === "smith_machine" ||
    exercise.equipmentType === "assisted_machine"
  ) {
    return "moderate";
  }

  return "low";
}

function getDerivedTimeCost(exercise: ExerciseDefinition): ExerciseMetadata["timeCost"] {
  if (exercise.timeCost) {
    return exercise.timeCost;
  }

  if (
    exercise.targetType === "distance" ||
    exercise.movementPattern === "conditioning" ||
    exercise.movementPattern === "sled" ||
    exercise.movementPattern === "olympic_lift"
  ) {
    return "long";
  }

  if (isCompoundExercise(exercise)) {
    return "moderate";
  }

  return "short";
}

function getDerivedBestForGoals(
  exercise: ExerciseDefinition
): ExerciseMetadata["bestForGoals"] {
  if (exercise.bestForGoals?.length) {
    return exercise.bestForGoals;
  }

  if (
    exercise.category === "conditioning" ||
    exercise.movementPattern === "conditioning" ||
    exercise.movementPattern === "sled" ||
    exercise.movementPattern === "jump"
  ) {
    return ["conditioning", "hybrid"];
  }

  if (exercise.movementPattern === "olympic_lift") {
    return ["skill", "strength", "hybrid"];
  }

  if (isIsolationExercise(exercise)) {
    return ["hypertrophy"];
  }

  if (isCompoundExercise(exercise)) {
    return ["strength", "hybrid", "hypertrophy"];
  }

  return ["hybrid"];
}

function getDerivedJointConcerns(
  exercise: ExerciseDefinition
): ExerciseJointConcern[] {
  if (exercise.avoidIfJointConcern?.length) {
    return exercise.avoidIfJointConcern;
  }

  const concerns = new Set<ExerciseJointConcern>();
  const pattern = exercise.movementPattern;

  if (shoulderConcernPatterns.has(pattern)) concerns.add("shoulders");
  if (elbowConcernPatterns.has(pattern)) concerns.add("elbows");
  if (wristConcernPatterns.has(pattern)) concerns.add("wrists");
  if (lowerBackConcernPatterns.has(pattern)) concerns.add("lower_back");
  if (hipConcernPatterns.has(pattern)) concerns.add("hips");
  if (kneeConcernPatterns.has(pattern)) concerns.add("knees");
  if (ankleConcernPatterns.has(pattern)) concerns.add("ankles");

  if (exercise.id.includes("dip")) {
    concerns.add("shoulders");
    concerns.add("elbows");
  }

  return [...concerns];
}

export function getExerciseMetadata(
  exercise: ExerciseDefinition | null | undefined
): ExerciseMetadata | null {
  if (!exercise) {
    return null;
  }

  const impactLevel = getDerivedImpactLevel(exercise);
  const technicalComplexity = getDerivedTechnicalComplexity(exercise);
  const recoveryCost = getDerivedRecoveryCost(exercise);
  const setupComplexity = getDerivedSetupComplexity(exercise);
  const jointConcerns = getDerivedJointConcerns(exercise);
  const jointStress =
    exercise.jointStress ??
    (impactLevel === "high" ||
    technicalComplexity === "high" ||
    jointConcerns.length >= 3
      ? "high"
      : jointConcerns.length > 0
        ? "moderate"
        : "low");

  return {
    recoveryCost,
    technicalComplexity,
    jointStress,
    impactLevel,
    setupComplexity,
    timeCost: getDerivedTimeCost(exercise),
    bestForGoals: getDerivedBestForGoals(exercise),
    avoidIfJointConcern: jointConcerns,
  };
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
  excludedExerciseIds,
  exerciseId,
}: {
  answers: OnboardingAnswers;
  availableEquipment: EquipmentItemId[];
  excludedExerciseIds?: Set<string>;
  exerciseId: string;
}) {
  const originalExercise = getExerciseById(exerciseId);

  if (!originalExercise) {
    return null;
  }

  const level = answers.experienceLevel ?? "beginner";
  const goal = (answers.goalPriority ?? answers.goal ?? "hypertrophy") as ExerciseIntelligenceGoal;
  const rankCandidate = (exercise: ExerciseDefinition) =>
    getExerciseCompatibilityScore({
      availableEquipment,
      exercise,
      goal,
      level,
      targetExercise: originalExercise,
    });
  const curatedCandidates = originalExercise.alternatives
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
            !excludedExerciseIds?.has(candidate.exercise.id) &&
            canPerformExercise(candidate.exercise.id, availableEquipment)
        )
    )
    .sort(
      (left, right) =>
        rankCandidate(right.exercise) - rankCandidate(left.exercise)
    );

  if (curatedCandidates[0]) {
    return curatedCandidates[0];
  }

  const libraryCandidates = exerciseLibrary.exercises
    .filter((exercise) => exercise.id !== originalExercise.id)
    .filter((exercise) => !excludedExerciseIds?.has(exercise.id))
    .filter((exercise) => canPerformExercise(exercise.id, availableEquipment))
    .filter((exercise) => {
      const hasSamePrimaryMuscle = hasSharedPrimaryMuscle(originalExercise, exercise);
      const hasSameMovementPattern =
        originalExercise.movementPattern === exercise.movementPattern;

      return hasSamePrimaryMuscle || hasSameMovementPattern;
    })
    .map((exercise) => ({
      alternative: {
        exerciseId: exercise.id,
        note: "Automatically selected from the exercise library because it fits your equipment.",
      },
      exercise,
    }))
    .sort(
      (left, right) =>
        rankCandidate(right.exercise) - rankCandidate(left.exercise)
    );

  return libraryCandidates[0] ?? null;
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
      highImpactRatio: 0,
      highRecoveryRatio: 0,
      jointConcernMatchRatio: 0,
      jointStressAverage: 0,
      longTimeCostRatio: 0,
      technicalComplexityAverage: 0,
    };
  }

  const level = answers.experienceLevel ?? "beginner";
  const goal = (answers.goalPriority ?? answers.goal ?? "hypertrophy") as ExerciseIntelligenceGoal;
  const total = exercises.length;
  const sum = (values: number[]) =>
    values.reduce((current, value) => current + value, 0);
  const metadata = exercises
    .map((exercise) => getExerciseMetadata(exercise))
    .filter((details): details is ExerciseMetadata => Boolean(details));
  const userJointConcerns = answers.jointConcerns ?? [];

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
    highImpactRatio:
      metadata.filter((details) => details.impactLevel === "high").length / total,
    highRecoveryRatio:
      metadata.filter((details) => details.recoveryCost === "high").length / total,
    jointConcernMatchRatio: userJointConcerns.length
      ? metadata.filter((details) =>
          details.avoidIfJointConcern.some((concern) =>
            userJointConcerns.includes(concern)
          )
        ).length / total
      : 0,
    jointStressAverage:
      sum(metadata.map((details) => levelValue[details.jointStress])) / total,
    longTimeCostRatio:
      metadata.filter((details) => details.timeCost === "long").length / total,
    technicalComplexityAverage:
      sum(metadata.map((details) => levelValue[details.technicalComplexity])) /
      total,
  };
}

export function getPrimaryMuscleLabels(muscles: MuscleGroup[]) {
  return muscles.map((muscle) => titleCase(muscle));
}

export function getEquipmentLabelsForItems(items: EquipmentItemId[]) {
  return items.map((item) => equipmentLabelsById[item]);
}
