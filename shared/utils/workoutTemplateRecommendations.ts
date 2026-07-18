import {
  exerciseLibrary,
  type WorkoutTemplate,
  type WorkoutTemplateWorkoutDay,
} from "../constants/exercise-library";
import type { OnboardingAnswers } from "../types/onboarding.types";
import {
  getAvailableEquipmentFromAnswers,
  getEquipmentCompatibilityRatio,
  getMissingEquipmentLabels,
} from "./equipmentRequirements";
import {
  getBestCompatibleAlternative,
  getExerciseMetadata,
  isExerciseTooAdvancedForLevel,
  summarizeExercisePool,
} from "./exerciseIntelligence";
import { getExerciseById } from "./exerciseLibraryAdapter";

export type WorkoutGoal = "hypertrophy" | "strength" | "hybrid";
export type WorkoutLevel = "beginner" | "intermediate" | "advanced";
export type WorkoutEquipment =
  | "full_gym"
  | "home_gym"
  | "dumbbells_only"
  | "basic_equipment";

export type WorkoutTemplateRecommendation = {
  explanation: WorkoutTemplateExplanation;
  isRecommended: boolean;
  matchReasons: string[];
  score: number;
  scoreBreakdown: WorkoutTemplateScoreBreakdown;
  tags: string[];
  template: WorkoutTemplate;
  warnings: string[];
};

export type WorkoutTemplateExplanation = {
  suggestedSubstitutions: string[];
  thingsToCheck: string[];
  tradeoffs: string[];
  whyThisPlan: string[];
};

export type WorkoutTemplateScoreBreakdown = {
  ageGuidance: number;
  bodyComposition: number;
  bodySizeGuidance: number;
  difficulty: number;
  equipment: number;
  exerciseGoalFit: number;
  exerciseStructure: number;
  experience: number;
  goal: number;
  jointConcernCompatibility: number;
  movementPatternCoverage: number;
  muscleVolumeBalance: number;
  preferenceFit: number;
  recentConsistency: number;
  recoveryQuality: number;
  schedule: number;
  sessionLength: number;
  substitutionQuality: number;
};

export const workoutRecommendationWeights = {
  exactDayMatch: 1000,
  fewerDaysBase: 700,
  fewerDaysDistancePenalty: 80,
  moreDaysBase: 250,
  moreDaysDistancePenalty: 120,
  exactExperienceMatch: 280,
  advancedUserIntermediatePlanFallback: 120,
  intermediateUserBeginnerPlanFallback: 80,
  exactGoalMatch: 220,
  hybridGoalFallback: 120,
  equipmentCompatibility: 270,
  exerciseEquipmentFit: 140,
  exerciseDifficultyFit: 220,
  exerciseGoalFit: 180,
  strengthCompoundRatio: 170,
  hypertrophyAccessoryRatio: 170,
  hypertrophyCompoundBonus: 70,
  hypertrophyCompoundBonusThreshold: 0.35,
  hybridCompoundBonus: 80,
  hybridCompoundBonusThreshold: 0.4,
  hybridAccessoryBonus: 80,
  hybridAccessoryBonusThreshold: 0.25,
  beginnerAdvancedExercisePenalty: 350,
  beginnerAdvancedExercisePenaltyThreshold: 0.15,
  youthBeginnerPlanBonus: 350,
  youthStrengthPlanPenalty: 120,
  youthHighFrequencyPenalty: 300,
  youthHighFrequencyThreshold: 3,
  olderAdvancedPlanPenalty: 260,
  olderStrengthFrequencyPenalty: 160,
  olderStrengthFrequencyThreshold: 4,
  olderOverSchedulePenalty: 200,
  sessionLengthGoodFit: 160,
  sessionLengthCloseFit: 60,
  sessionLengthOveragePenaltyPerMinute: 8,
  sessionLengthMaxPenalty: 220,
  shortSessionExerciseCountThreshold: 4,
  shortSessionExerciseCountBonus: 40,
  brandNewBeginnerPlanBonus: 180,
  brandNewLowFrequencyBonus: 100,
  brandNewAdvancedPlanPenalty: 160,
  brandNewHighFrequencyPenalty: 180,
  inconsistentLowModerateFrequencyBonus: 120,
  inconsistentHighFrequencyPenalty: 160,
  inconsistentAdvancedPlanPenalty: 80,
  oneTwoDaysMatchingFrequencyBonus: 120,
  oneTwoDaysHighFrequencyPenalty: 120,
  threeFourDaysMatchingFrequencyBonus: 140,
  threeFourDaysHighFrequencyPenalty: 50,
  fivePlusDaysMatchingFrequencyBonus: 140,
  fivePlusDaysLowFrequencyPenalty: 60,
  fatLossModerateFrequencyBonus: 80,
  fatLossHighFrequencyPenalty: 50,
  muscleGainAccessoryRatio: 90,
  muscleGainLowVolumePenalty: 70,
  maintainBalancedPlanBonus: 60,
  higherBodySizeModerateFrequencyBonus: 80,
  higherBodySizeAdvancedPlanPenalty: 100,
  higherBodySizeOverSchedulePenalty: 80,
  higherBodySizeConditioningPenalty: 60,
  lowerBodySizeMuscleGainBonus: 50,
  broadMovementCoverageBonus: 140,
  missingMovementPatternPenalty: 40,
  hybridMuscleBalanceBonus: 110,
  upperLowerImbalancePenalty: 90,
  recoveryHighCostPenalty: 170,
  recoveryHighImpactPenalty: 120,
  recoveryComplexityPenalty: 70,
  recoveryLowCostBeginnerBonus: 60,
  jointConcernExercisePenalty: 260,
  jointStressConcernPenalty: 80,
  dislikedExercisePenalty: 360,
  dislikedMovementPatternPenalty: 80,
  bodyweightScalingPenalty: 70,
  substitutionAvailableBonus: 55,
  substitutionUnavailablePenalty: 90,
} as const;

const sessionLengthRanges = {
  "20_30": { min: 20, max: 30 },
  "30_45": { min: 30, max: 45 },
  "45_60": { min: 45, max: 60 },
  "60_90": { min: 60, max: 90 },
} as const;

export function getBodyMassIndex(answers: OnboardingAnswers) {
  if (!answers.heightInches || !answers.bodyWeight) {
    return undefined;
  }

  const weightInPounds =
    answers.weightUnit === "kg" ? answers.bodyWeight * 2.20462 : answers.bodyWeight;

  return (weightInPounds / (answers.heightInches * answers.heightInches)) * 703;
}

export function getRequestedGoal(answers: OnboardingAnswers): WorkoutGoal {
  return (answers.goalPriority ?? answers.goal ?? "hypertrophy") as WorkoutGoal;
}

export function getRequestedLevel(answers: OnboardingAnswers): WorkoutLevel {
  return answers.experienceLevel ?? "beginner";
}

export function getRequestedEquipment(answers: OnboardingAnswers): WorkoutEquipment {
  return answers.equipmentAccess ?? "full_gym";
}

export function getRequestedTrainingDays(answers: OnboardingAnswers): number {
  return answers.availableTrainingDays ?? 3;
}

export function getTemplateGoal(template: WorkoutTemplate): WorkoutGoal {
  const goalText = `${template.primaryGoal} ${template.focus}`.toLowerCase();

  if (
    goalText.includes("muscle and strength") ||
    goalText.includes("strength and hypertrophy") ||
    goalText.includes("power and hypertrophy") ||
    goalText.includes("general fitness")
  ) {
    return "hybrid";
  }

  if (goalText.includes("strength") || goalText.includes("powerlifting")) {
    return "strength";
  }

  return "hypertrophy";
}

export function getTemplateWorkoutDays(template: WorkoutTemplate) {
  return template.workoutDays.filter(
    (day): day is WorkoutTemplateWorkoutDay => day.type === "workout"
  );
}

export function getEquipmentCompatibilityScore(
  template: WorkoutTemplate,
  answers: Pick<OnboardingAnswers, "availableEquipment" | "equipmentAccess">
) {
  const workoutExerciseIds = getTemplateWorkoutDays(template).flatMap(
    (day) => day.exerciseIds
  );

  return getEquipmentCompatibilityRatio(
    workoutExerciseIds,
    getAvailableEquipmentFromAnswers(answers)
  );
}

function getTemplateExercises(template: WorkoutTemplate) {
  return getTemplateWorkoutDays(template)
    .flatMap((day) => day.exerciseIds)
    .map((exerciseId) => getExerciseById(exerciseId))
    .filter((exercise): exercise is NonNullable<typeof exercise> => Boolean(exercise));
}

function getMovementCoverageScore(exercises: ReturnType<typeof getTemplateExercises>) {
  const coveredPatterns = new Set(exercises.map((exercise) => exercise.movementPattern));
  const foundationalPatterns = [
    "squat",
    "hinge",
    "horizontal_press",
    "vertical_press",
    "horizontal_pull",
    "vertical_pull",
  ] as const;

  return (
    foundationalPatterns.filter((pattern) => coveredPatterns.has(pattern)).length /
    foundationalPatterns.length
  );
}

function getMuscleBalanceScore(exercises: ReturnType<typeof getTemplateExercises>) {
  if (exercises.length === 0) {
    return 0;
  }

  const upperCount = exercises.filter((exercise) =>
    exercise.primaryMuscles.some((muscle) =>
      [
        "chest",
        "upper_chest",
        "lower_chest",
        "lats",
        "upper_back",
        "rear_delts",
        "lateral_delts",
        "front_delts",
        "shoulders",
        "triceps",
        "biceps",
      ].includes(muscle)
    )
  ).length;
  const lowerCount = exercises.filter((exercise) =>
    exercise.primaryMuscles.some((muscle) =>
      [
        "quadriceps",
        "hamstrings",
        "glutes",
        "calves",
        "adductors",
        "abductors",
      ].includes(muscle)
    )
  ).length;
  const differenceRatio = Math.abs(upperCount - lowerCount) / exercises.length;

  return Math.max(0, 1 - differenceRatio);
}

function getDislikedMovementPatterns(answers: OnboardingAnswers) {
  return new Set(
    (answers.dislikedExerciseIds ?? [])
      .map((exerciseId) => getExerciseById(exerciseId)?.movementPattern)
      .filter((pattern): pattern is NonNullable<typeof pattern> => Boolean(pattern))
  );
}

function hasJointConcernConflict(
  exercise: ReturnType<typeof getTemplateExercises>[number],
  answers: OnboardingAnswers
) {
  const jointConcerns = answers.jointConcerns ?? [];

  if (jointConcerns.length === 0) {
    return false;
  }

  return Boolean(
    getExerciseMetadata(exercise)?.avoidIfJointConcern.some((concern) =>
      jointConcerns.includes(concern)
    )
  );
}

function hasAvailableAlternative(exerciseId: string, answers: OnboardingAnswers) {
  return Boolean(
    getBestCompatibleAlternative({
      answers,
      availableEquipment: getAvailableEquipmentFromAnswers(answers),
      exerciseId,
    })
  );
}

function getExerciseDisplayName(exerciseId: string) {
  const exercise = getExerciseById(exerciseId);

  return exercise?.displayName ?? exercise?.name ?? exerciseId;
}

function getTemplateSubstitutionSuggestions(
  template: WorkoutTemplate,
  answers: OnboardingAnswers
) {
  const availableEquipment = getAvailableEquipmentFromAnswers(answers);
  const dislikedExerciseIds = new Set(answers.dislikedExerciseIds ?? []);
  const suggestions = getTemplateExercises(template)
    .filter((exercise) => {
      const isDisliked = dislikedExerciseIds.has(exercise.id);
      const hasJointConflict = hasJointConcernConflict(exercise, answers);
      const missingEquipmentLabels = getMissingEquipmentLabels(
        exercise.id,
        availableEquipment
      );
      const isMissingEquipment =
        availableEquipment.length > 0 && missingEquipmentLabels.length > 0;

      return isDisliked || hasJointConflict || isMissingEquipment;
    })
    .map((exercise) => {
      const replacement = getBestCompatibleAlternative({
        answers,
        availableEquipment,
        exerciseId: exercise.id,
      });

      if (!replacement?.exercise) {
        return null;
      }

      return `Swap ${getExerciseDisplayName(exercise.id)} for ${getExerciseDisplayName(
        replacement.exercise.id
      )}`;
    })
    .filter((suggestion): suggestion is string => Boolean(suggestion));

  return [...new Set(suggestions)].slice(0, 4);
}

export function getTemplateExerciseProfile(
  template: WorkoutTemplate,
  answers: OnboardingAnswers
) {
  return summarizeExercisePool(
    getTemplateExercises(template),
    answers,
    getAvailableEquipmentFromAnswers(answers)
  );
}

function getEstimatedWorkoutMinutes(template: WorkoutTemplate) {
  const workoutDays = getTemplateWorkoutDays(template);

  if (workoutDays.length === 0) {
    return 0;
  }

  const estimatedDayMinutes = workoutDays.map((day) => {
    const compoundExerciseCount = day.exerciseIds.filter(
      (exerciseId) => getExerciseById(exerciseId)?.isCompound
    ).length;
    const accessoryExerciseCount = day.exerciseIds.length - compoundExerciseCount;

    return 8 + compoundExerciseCount * 9 + accessoryExerciseCount * 6;
  });

  return Math.max(...estimatedDayMinutes);
}

export function getTemplateRecommendationScore(
  template: WorkoutTemplate,
  answers: OnboardingAnswers
) {
  const breakdown = getTemplateRecommendationScoreBreakdown(template, answers);

  return Object.values(breakdown).reduce((total, value) => total + value, 0);
}

export function getTemplateRecommendationScoreBreakdown(
  template: WorkoutTemplate,
  answers: OnboardingAnswers
): WorkoutTemplateScoreBreakdown {
  const requestedGoal = getRequestedGoal(answers);
  const requestedLevel = getRequestedLevel(answers);
  const requestedTrainingDays = getRequestedTrainingDays(answers);
  const templateGoal = getTemplateGoal(template);
  const dayDifference = requestedTrainingDays - template.daysRequired;
  const isOverRequestedDays = dayDifference < 0;
  const equipmentScore = getEquipmentCompatibilityScore(template, answers);
  const exerciseProfile = getTemplateExerciseProfile(template, answers);
  const templateExercises = getTemplateExercises(template);
  const movementCoverageScore = getMovementCoverageScore(templateExercises);
  const muscleBalanceScore = getMuscleBalanceScore(templateExercises);
  const dislikedExerciseIds = new Set(answers.dislikedExerciseIds ?? []);
  const dislikedMovementPatterns = getDislikedMovementPatterns(answers);
  const dislikedExercisesInTemplate = templateExercises.filter((exercise) =>
    dislikedExerciseIds.has(exercise.id)
  );
  const dislikedPatternMatches = templateExercises.filter(
    (exercise) =>
      !dislikedExerciseIds.has(exercise.id) &&
      dislikedMovementPatterns.has(exercise.movementPattern)
  );
  const jointConcernConflicts = templateExercises.filter((exercise) =>
    hasJointConcernConflict(exercise, answers)
  );
  const substitutionCandidateIds = [
    ...dislikedExercisesInTemplate.map((exercise) => exercise.id),
    ...jointConcernConflicts.map((exercise) => exercise.id),
  ];
  const uniqueSubstitutionCandidateIds = [...new Set(substitutionCandidateIds)];
  const availableSubstitutionCount = uniqueSubstitutionCandidateIds.filter((exerciseId) =>
    hasAvailableAlternative(exerciseId, answers)
  ).length;
  const breakdown: WorkoutTemplateScoreBreakdown = {
    ageGuidance: 0,
    bodyComposition: 0,
    bodySizeGuidance: 0,
    difficulty: 0,
    equipment: 0,
    exerciseGoalFit: 0,
    exerciseStructure: 0,
    experience: 0,
    goal: 0,
    jointConcernCompatibility: 0,
    movementPatternCoverage: 0,
    muscleVolumeBalance: 0,
    preferenceFit: 0,
    recentConsistency: 0,
    recoveryQuality: 0,
    schedule: 0,
    sessionLength: 0,
    substitutionQuality: 0,
  };
  const weights = workoutRecommendationWeights;
  const bodyMassIndex = getBodyMassIndex(answers);

  if (template.daysRequired === requestedTrainingDays) {
    breakdown.schedule += weights.exactDayMatch;
  } else if (!isOverRequestedDays) {
    breakdown.schedule +=
      weights.fewerDaysBase -
      Math.abs(dayDifference) * weights.fewerDaysDistancePenalty;
  } else {
    breakdown.schedule +=
      weights.moreDaysBase -
      Math.abs(dayDifference) * weights.moreDaysDistancePenalty;
  }

  if (template.experienceLevel === requestedLevel) {
    breakdown.experience += weights.exactExperienceMatch;
  } else if (
    requestedLevel === "advanced" &&
    template.experienceLevel === "intermediate"
  ) {
    breakdown.experience += weights.advancedUserIntermediatePlanFallback;
  } else if (
    requestedLevel === "intermediate" &&
    template.experienceLevel === "beginner"
  ) {
    breakdown.experience += weights.intermediateUserBeginnerPlanFallback;
  }

  if (templateGoal === requestedGoal) {
    breakdown.goal += weights.exactGoalMatch;
  } else if (requestedGoal === "hybrid" || templateGoal === "hybrid") {
    breakdown.goal += weights.hybridGoalFallback;
  }

  breakdown.equipment += equipmentScore * weights.equipmentCompatibility;
  breakdown.equipment +=
    exerciseProfile.equipmentFitRatio * weights.exerciseEquipmentFit;
  breakdown.difficulty +=
    exerciseProfile.difficultyFitAverage * weights.exerciseDifficultyFit;
  breakdown.exerciseGoalFit +=
    exerciseProfile.goalFitAverage * weights.exerciseGoalFit;

  if (requestedGoal === "strength") {
    breakdown.exerciseStructure +=
      exerciseProfile.compoundRatio * weights.strengthCompoundRatio;
  } else if (requestedGoal === "hypertrophy") {
    breakdown.exerciseStructure +=
      exerciseProfile.accessoryRatio * weights.hypertrophyAccessoryRatio;
    breakdown.exerciseStructure +=
      exerciseProfile.compoundRatio > weights.hypertrophyCompoundBonusThreshold
        ? weights.hypertrophyCompoundBonus
        : 0;
  } else {
    breakdown.exerciseStructure +=
      exerciseProfile.compoundRatio > weights.hybridCompoundBonusThreshold
        ? weights.hybridCompoundBonus
        : 0;
    breakdown.exerciseStructure +=
      exerciseProfile.accessoryRatio > weights.hybridAccessoryBonusThreshold
        ? weights.hybridAccessoryBonus
        : 0;
  }

  if (
    requestedLevel === "beginner" &&
    exerciseProfile.advancedRatio > weights.beginnerAdvancedExercisePenaltyThreshold
  ) {
    breakdown.difficulty -=
      exerciseProfile.advancedRatio * weights.beginnerAdvancedExercisePenalty;
  }

  if (answers.ageRange === "7_15") {
    if (template.experienceLevel === "beginner") {
      breakdown.ageGuidance += weights.youthBeginnerPlanBonus;
    }

    if (templateGoal === "strength") {
      breakdown.ageGuidance -= weights.youthStrengthPlanPenalty;
    }

    if (template.daysRequired > weights.youthHighFrequencyThreshold) {
      breakdown.ageGuidance -= weights.youthHighFrequencyPenalty;
    }
  }

  if (answers.ageRange === "40_49" || answers.ageRange === "50_plus") {
    if (template.experienceLevel === "advanced") {
      breakdown.ageGuidance -= weights.olderAdvancedPlanPenalty;
    }

    if (
      templateGoal === "strength" &&
      template.daysRequired >= weights.olderStrengthFrequencyThreshold
    ) {
      breakdown.ageGuidance -= weights.olderStrengthFrequencyPenalty;
    }

    if (template.daysRequired > requestedTrainingDays) {
      breakdown.ageGuidance -= weights.olderOverSchedulePenalty;
    }
  }

  if (answers.sessionLength) {
    const estimatedMinutes = getEstimatedWorkoutMinutes(template);
    const sessionRange = sessionLengthRanges[answers.sessionLength];

    if (estimatedMinutes <= sessionRange.max && estimatedMinutes >= sessionRange.min - 10) {
      breakdown.sessionLength += weights.sessionLengthGoodFit;
    } else if (estimatedMinutes <= sessionRange.max + 10) {
      breakdown.sessionLength += weights.sessionLengthCloseFit;
    } else {
      breakdown.sessionLength -= Math.min(
        (estimatedMinutes - sessionRange.max) *
          weights.sessionLengthOveragePenaltyPerMinute,
        weights.sessionLengthMaxPenalty
      );
    }

    if (
      answers.sessionLength === "20_30" &&
      Math.max(...getTemplateWorkoutDays(template).map((day) => day.exerciseIds.length)) <=
        weights.shortSessionExerciseCountThreshold
    ) {
      breakdown.sessionLength += weights.shortSessionExerciseCountBonus;
    }
  }

  breakdown.movementPatternCoverage +=
    movementCoverageScore * weights.broadMovementCoverageBonus;

  if (templateGoal === "hybrid" || requestedGoal === "hybrid") {
    breakdown.muscleVolumeBalance +=
      muscleBalanceScore * weights.hybridMuscleBalanceBonus;
  } else if (muscleBalanceScore < 0.35 && template.daysRequired <= 4) {
    breakdown.muscleVolumeBalance -= weights.upperLowerImbalancePenalty;
  }

  if (movementCoverageScore < 0.5 && requestedGoal !== "hypertrophy") {
    breakdown.movementPatternCoverage -=
      (0.5 - movementCoverageScore) * weights.missingMovementPatternPenalty;
  }

  if (answers.recentTrainingConsistency === "brand_new") {
    if (template.experienceLevel === "beginner") {
      breakdown.recentConsistency += weights.brandNewBeginnerPlanBonus;
    }

    if (template.daysRequired <= 3) {
      breakdown.recentConsistency += weights.brandNewLowFrequencyBonus;
    }

    if (template.experienceLevel === "advanced") {
      breakdown.recentConsistency -= weights.brandNewAdvancedPlanPenalty;
    }

    if (template.daysRequired > 3) {
      breakdown.recentConsistency -= weights.brandNewHighFrequencyPenalty;
    }
  }

  if (
    requestedLevel === "beginner" ||
    answers.recentTrainingConsistency === "brand_new" ||
    answers.recentTrainingConsistency === "inconsistent"
  ) {
    breakdown.recoveryQuality -=
      exerciseProfile.highRecoveryRatio * weights.recoveryHighCostPenalty;
    breakdown.recoveryQuality -=
      exerciseProfile.highImpactRatio * weights.recoveryHighImpactPenalty;
    breakdown.recoveryQuality -=
      Math.max(0, exerciseProfile.technicalComplexityAverage - 1.5) *
      weights.recoveryComplexityPenalty;

    if (
      template.experienceLevel === "beginner" &&
      exerciseProfile.highRecoveryRatio < 0.35
    ) {
      breakdown.recoveryQuality += weights.recoveryLowCostBeginnerBonus;
    }
  }

  if (answers.recentTrainingConsistency === "inconsistent") {
    if (template.daysRequired <= 4) {
      breakdown.recentConsistency += weights.inconsistentLowModerateFrequencyBonus;
    }

    if (template.daysRequired > 4) {
      breakdown.recentConsistency -= weights.inconsistentHighFrequencyPenalty;
    }

    if (template.experienceLevel === "advanced") {
      breakdown.recentConsistency -= weights.inconsistentAdvancedPlanPenalty;
    }
  }

  if (answers.recentTrainingConsistency === "one_two_days") {
    if (template.daysRequired <= 3) {
      breakdown.recentConsistency += weights.oneTwoDaysMatchingFrequencyBonus;
    }

    if (template.daysRequired > 4) {
      breakdown.recentConsistency -= weights.oneTwoDaysHighFrequencyPenalty;
    }
  }

  if (answers.recentTrainingConsistency === "three_four_days") {
    if (template.daysRequired >= 3 && template.daysRequired <= 4) {
      breakdown.recentConsistency += weights.threeFourDaysMatchingFrequencyBonus;
    }

    if (template.daysRequired >= 5) {
      breakdown.recentConsistency -= weights.threeFourDaysHighFrequencyPenalty;
    }
  }

  if (answers.recentTrainingConsistency === "five_plus_days") {
    if (template.daysRequired >= 5) {
      breakdown.recentConsistency += weights.fivePlusDaysMatchingFrequencyBonus;
    }

    if (template.daysRequired <= 2) {
      breakdown.recentConsistency -= weights.fivePlusDaysLowFrequencyPenalty;
    }
  }

  if (answers.bodyCompositionGoal === "lose_fat") {
    if (template.daysRequired >= 3 && template.daysRequired <= 5) {
      breakdown.bodyComposition += weights.fatLossModerateFrequencyBonus;
    }

    if (template.daysRequired > requestedTrainingDays) {
      breakdown.bodyComposition -= weights.fatLossHighFrequencyPenalty;
    }
  }

  if (answers.bodyCompositionGoal === "gain_muscle") {
    breakdown.bodyComposition +=
      exerciseProfile.accessoryRatio * weights.muscleGainAccessoryRatio;

    if (template.daysRequired < 3) {
      breakdown.bodyComposition -= weights.muscleGainLowVolumePenalty;
    }
  }

  if (answers.bodyCompositionGoal === "maintain_weight" && templateGoal === "hybrid") {
    breakdown.bodyComposition += weights.maintainBalancedPlanBonus;
  }

  if (bodyMassIndex !== undefined && bodyMassIndex >= 30) {
    if (template.daysRequired >= 2 && template.daysRequired <= 4) {
      breakdown.bodySizeGuidance += weights.higherBodySizeModerateFrequencyBonus;
    }

    if (template.experienceLevel === "advanced") {
      breakdown.bodySizeGuidance -= weights.higherBodySizeAdvancedPlanPenalty;
    }

    if (template.daysRequired > requestedTrainingDays) {
      breakdown.bodySizeGuidance -= weights.higherBodySizeOverSchedulePenalty;
    }

    if (exerciseProfile.compoundRatio > 0.85 && template.daysRequired > 4) {
      breakdown.bodySizeGuidance -= weights.higherBodySizeConditioningPenalty;
    }
  }

  if (
    bodyMassIndex !== undefined &&
    bodyMassIndex < 18.5 &&
    answers.bodyCompositionGoal === "gain_muscle"
  ) {
    breakdown.bodySizeGuidance += weights.lowerBodySizeMuscleGainBonus;
  }

  if (bodyMassIndex !== undefined && bodyMassIndex >= 30) {
    breakdown.bodySizeGuidance -=
      exerciseProfile.highImpactRatio * weights.bodyweightScalingPenalty;
  }

  if (dislikedExerciseIds.size > 0) {
    breakdown.preferenceFit -=
      dislikedExercisesInTemplate.length * weights.dislikedExercisePenalty;
    breakdown.preferenceFit -=
      dislikedPatternMatches.length * weights.dislikedMovementPatternPenalty;
  }

  if ((answers.jointConcerns ?? []).length > 0) {
    breakdown.jointConcernCompatibility -=
      exerciseProfile.jointConcernMatchRatio * weights.jointConcernExercisePenalty;
    breakdown.jointConcernCompatibility -=
      Math.max(0, exerciseProfile.jointStressAverage - 1.5) *
      weights.jointStressConcernPenalty;
  }

  if (uniqueSubstitutionCandidateIds.length > 0) {
    breakdown.substitutionQuality +=
      availableSubstitutionCount * weights.substitutionAvailableBonus;
    breakdown.substitutionQuality -=
      (uniqueSubstitutionCandidateIds.length - availableSubstitutionCount) *
      weights.substitutionUnavailablePenalty;
  }

  return breakdown;
}

export function getRecommendedWorkoutTemplate(answers: OnboardingAnswers) {
  return getRankedWorkoutTemplateRecommendations(answers)[0]?.template ??
    exerciseLibrary.workoutTemplates[0];
}

export function getSelectedWorkoutTemplate(answers: OnboardingAnswers) {
  return (
    exerciseLibrary.workoutTemplates.find(
      (template) => template.id === answers.selectedWorkoutTemplateId
    ) ?? getRecommendedWorkoutTemplate(answers)
  );
}

export function getWorkoutTemplateWarnings(
  template: WorkoutTemplate,
  answers: OnboardingAnswers
) {
  const warnings: string[] = [];
  const requestedTrainingDays = answers.availableTrainingDays;
  const requestedLevel = answers.experienceLevel;
  const hasEquipmentAnswers = Boolean(
    answers.equipmentAccess || answers.availableEquipment?.length
  );
  const templateGoal = getTemplateGoal(template);

  if (requestedTrainingDays && template.daysRequired > requestedTrainingDays) {
    warnings.push(`Requires ${template.daysRequired} days per week`);
  }

  if (
    requestedLevel === "beginner" &&
    (template.experienceLevel === "intermediate" ||
      template.experienceLevel === "advanced")
  ) {
    warnings.push("More advanced than your experience level");
  }

  if (requestedLevel === "intermediate" && template.experienceLevel === "advanced") {
    warnings.push("Advanced plan");
  }

  if (
    requestedLevel &&
    getTemplateExercises(template).some((exercise) =>
      isExerciseTooAdvancedForLevel(exercise, requestedLevel)
    )
  ) {
    warnings.push("Includes advanced exercise options");
  }

  if (
    hasEquipmentAnswers &&
    getEquipmentCompatibilityScore(template, answers) < 0.75
  ) {
    const missingEquipment = getTemplateWorkoutDays(template)
      .flatMap((day) => day.exerciseIds)
      .flatMap((exerciseId) =>
        getMissingEquipmentLabels(
          exerciseId,
          getAvailableEquipmentFromAnswers(answers)
        )
      );
    const uniqueMissingEquipment = [...new Set(missingEquipment)].slice(0, 3);

    warnings.push(
      uniqueMissingEquipment.length
        ? `May need: ${uniqueMissingEquipment.join(", ")}`
        : "May need equipment you did not select"
    );
  }

  if (answers.dislikedExerciseIds?.length) {
    const dislikedExercises = getTemplateExercises(template).filter((exercise) =>
      answers.dislikedExerciseIds?.includes(exercise.id)
    );

    if (dislikedExercises.length > 0) {
      warnings.push(
        dislikedExercises.length === 1
          ? "Includes 1 exercise you marked as disliked"
          : `Includes ${dislikedExercises.length} exercises you marked as disliked`
      );
    }
  }

  if (answers.jointConcerns?.length) {
    const jointConcernMatches = getTemplateExercises(template).filter((exercise) =>
      hasJointConcernConflict(exercise, answers)
    );

    if (jointConcernMatches.length > 0) {
      warnings.push("Includes movements to review for your joint concerns");
    }
  }

  if (
    (answers.ageRange === "40_49" || answers.ageRange === "50_plus") &&
    templateGoal === "strength"
  ) {
    warnings.push("Strength-heavy plan; recovery may need extra attention");
  }

  return warnings;
}

export function getWorkoutTemplateTradeoffs(
  template: WorkoutTemplate,
  answers: OnboardingAnswers
) {
  const tradeoffs: string[] = [];
  const requestedTrainingDays = answers.availableTrainingDays;
  const requestedLevel = answers.experienceLevel;
  const profile = getTemplateExerciseProfile(template, answers);
  const templateGoal = getTemplateGoal(template);
  const estimatedMinutes = getEstimatedWorkoutMinutes(template);

  if (requestedTrainingDays && template.daysRequired > requestedTrainingDays) {
    tradeoffs.push(
      `Needs ${template.daysRequired} training days, which is more than your ${requestedTrainingDays}-day preference`
    );
  }

  if (answers.sessionLength) {
    const sessionRange = sessionLengthRanges[answers.sessionLength];

    if (estimatedMinutes > sessionRange.max) {
      tradeoffs.push(
        `Some sessions may run about ${estimatedMinutes} minutes, longer than your selected window`
      );
    }
  }

  if (requestedLevel === "beginner" && template.experienceLevel !== "beginner") {
    tradeoffs.push("Uses a more experienced plan structure than your current level");
  }

  if (templateGoal === "strength" && profile.accessoryRatio < 0.25) {
    tradeoffs.push("Prioritizes compound strength work over accessory volume");
  }

  if (templateGoal === "hypertrophy" && profile.compoundRatio < 0.35) {
    tradeoffs.push("Leans more toward targeted muscle work than broad strength practice");
  }

  if (profile.longTimeCostRatio > 0.25) {
    tradeoffs.push("Includes several exercises that may take longer to set up or complete");
  }

  return [...new Set(tradeoffs)];
}

export function getWorkoutTemplateExplanation(
  template: WorkoutTemplate,
  answers: OnboardingAnswers
): WorkoutTemplateExplanation {
  return {
    suggestedSubstitutions: getTemplateSubstitutionSuggestions(template, answers),
    thingsToCheck: getWorkoutTemplateWarnings(template, answers),
    tradeoffs: getWorkoutTemplateTradeoffs(template, answers),
    whyThisPlan: getWorkoutTemplateMatchReasons(template, answers),
  };
}

export function getWorkoutTemplateMatchReasons(
  template: WorkoutTemplate,
  answers: OnboardingAnswers
) {
  const reasons: string[] = [];
  const requestedGoal = answers.goalPriority ?? answers.goal;
  const requestedLevel = answers.experienceLevel;
  const hasEquipmentAnswers = Boolean(
    answers.equipmentAccess || answers.availableEquipment?.length
  );
  const requestedTrainingDays = answers.availableTrainingDays;
  const templateGoal = getTemplateGoal(template);
  const exerciseProfile = getTemplateExerciseProfile(template, answers);

  if (requestedTrainingDays && template.daysRequired === requestedTrainingDays) {
    reasons.push(`Matches your ${requestedTrainingDays}-day weekly schedule`);
  } else if (requestedTrainingDays && template.daysRequired < requestedTrainingDays) {
    reasons.push(`Fits within your ${requestedTrainingDays}-day weekly availability`);
  }

  if (requestedGoal && templateGoal === requestedGoal) {
    reasons.push(`Matches your ${requestedGoal} goal`);
  } else if (requestedGoal && (requestedGoal === "hybrid" || templateGoal === "hybrid")) {
    reasons.push("Balances muscle and strength work");
  }

  if (requestedLevel && template.experienceLevel === requestedLevel) {
    reasons.push(`Matches your ${requestedLevel} experience level`);
  }

  if (
    hasEquipmentAnswers &&
    getEquipmentCompatibilityScore(template, answers) >= 0.75
  ) {
    reasons.push("Fits most of your equipment access");
  }

  if (exerciseProfile.equipmentFitRatio >= 0.9) {
    reasons.push("Strong equipment match");
  }

  if (requestedLevel && exerciseProfile.beginnerFriendlyRatio >= 0.85) {
    reasons.push("Mostly beginner-friendly exercises");
  }

  if (templateGoal === "strength" && exerciseProfile.compoundRatio >= 0.6) {
    reasons.push("Compound-heavy strength structure");
  }

  if (
    templateGoal === "hypertrophy" &&
    exerciseProfile.compoundRatio >= 0.35 &&
    exerciseProfile.accessoryRatio >= 0.25
  ) {
    reasons.push("Balances compound lifts with accessory volume");
  }

  if (answers.ageRange === "7_15" && template.experienceLevel === "beginner") {
    reasons.push("Keeps the focus on learning clean movement first");
  }

  if (
    (answers.ageRange === "40_49" || answers.ageRange === "50_plus") &&
    template.experienceLevel !== "advanced"
  ) {
    reasons.push("Keeps recovery demands reasonable");
  }

  if (
    answers.jointConcerns?.length &&
    exerciseProfile.jointConcernMatchRatio === 0
  ) {
    reasons.push("Avoids your selected joint-concern areas");
  }

  if (
    answers.dislikedExerciseIds?.length &&
    getTemplateExercises(template).every(
      (exercise) => !answers.dislikedExerciseIds?.includes(exercise.id)
    )
  ) {
    reasons.push("Avoids exercises you marked as disliked");
  }

  return reasons.length > 0
    ? reasons
    : ["Best overall match based on your current answers"];
}

export function getWorkoutTemplateTags(
  template: WorkoutTemplate,
  answers: OnboardingAnswers,
  recommendedTemplateId?: string
) {
  const tags = [
    template.primaryGoal,
    `${template.daysRequired} days`,
    template.experienceLevel,
  ];

  if (template.id === recommendedTemplateId) {
    tags.unshift("Best match");
  }

  for (const warning of getWorkoutTemplateWarnings(template, answers)) {
    tags.push(warning);
  }

  return tags;
}

export function getRankedWorkoutTemplateRecommendations(
  answers: OnboardingAnswers
): WorkoutTemplateRecommendation[] {
  const rankedTemplates = [...exerciseLibrary.workoutTemplates].sort(
    (left, right) =>
      getTemplateRecommendationScore(right, answers) -
      getTemplateRecommendationScore(left, answers)
  );
  const recommendedTemplateId = rankedTemplates[0]?.id;

  return rankedTemplates.map((template) => ({
    explanation: getWorkoutTemplateExplanation(template, answers),
    isRecommended: template.id === recommendedTemplateId,
    matchReasons: getWorkoutTemplateMatchReasons(template, answers),
    score: getTemplateRecommendationScore(template, answers),
    scoreBreakdown: getTemplateRecommendationScoreBreakdown(template, answers),
    tags: getWorkoutTemplateTags(template, answers, recommendedTemplateId),
    template,
    warnings: getWorkoutTemplateWarnings(template, answers),
  }));
}
