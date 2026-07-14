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
  isRecommended: boolean;
  matchReasons: string[];
  score: number;
  tags: string[];
  template: WorkoutTemplate;
  warnings: string[];
};

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

export function getTemplateRecommendationScore(
  template: WorkoutTemplate,
  answers: OnboardingAnswers
) {
  const requestedGoal = getRequestedGoal(answers);
  const requestedLevel = getRequestedLevel(answers);
  const requestedTrainingDays = getRequestedTrainingDays(answers);
  const templateGoal = getTemplateGoal(template);
  const dayDifference = requestedTrainingDays - template.daysRequired;
  const isOverRequestedDays = dayDifference < 0;
  const equipmentScore = getEquipmentCompatibilityScore(template, answers);
  const exerciseProfile = getTemplateExerciseProfile(template, answers);
  let score = 0;

  if (template.daysRequired === requestedTrainingDays) {
    score += 1000;
  } else if (!isOverRequestedDays) {
    score += 700 - Math.abs(dayDifference) * 80;
  } else {
    score += 250 - Math.abs(dayDifference) * 120;
  }

  if (template.experienceLevel === requestedLevel) {
    score += 280;
  } else if (
    requestedLevel === "advanced" &&
    template.experienceLevel === "intermediate"
  ) {
    score += 120;
  } else if (
    requestedLevel === "intermediate" &&
    template.experienceLevel === "beginner"
  ) {
    score += 80;
  }

  if (templateGoal === requestedGoal) {
    score += 220;
  } else if (requestedGoal === "hybrid" || templateGoal === "hybrid") {
    score += 120;
  }

  score += equipmentScore * 270;
  score += exerciseProfile.difficultyFitAverage * 220;
  score += exerciseProfile.goalFitAverage * 180;
  score += exerciseProfile.equipmentFitRatio * 140;

  if (requestedGoal === "strength") {
    score += exerciseProfile.compoundRatio * 170;
  } else if (requestedGoal === "hypertrophy") {
    score += exerciseProfile.accessoryRatio * 170;
    score += exerciseProfile.compoundRatio > 0.35 ? 70 : 0;
  } else {
    score += exerciseProfile.compoundRatio > 0.4 ? 80 : 0;
    score += exerciseProfile.accessoryRatio > 0.25 ? 80 : 0;
  }

  if (requestedLevel === "beginner" && exerciseProfile.advancedRatio > 0.15) {
    score -= exerciseProfile.advancedRatio * 350;
  }

  if (answers.ageRange === "7_15") {
    if (template.experienceLevel === "beginner") {
      score += 350;
    }

    if (templateGoal === "strength") {
      score -= 120;
    }

    if (template.daysRequired > 3) {
      score -= 300;
    }
  }

  if (answers.ageRange === "40_49" || answers.ageRange === "50_plus") {
    if (template.experienceLevel === "advanced") {
      score -= 260;
    }

    if (templateGoal === "strength" && template.daysRequired >= 4) {
      score -= 160;
    }

    if (template.daysRequired > requestedTrainingDays) {
      score -= 200;
    }
  }

  return score;
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

  if (
    (answers.ageRange === "40_49" || answers.ageRange === "50_plus") &&
    templateGoal === "strength"
  ) {
    warnings.push("Strength-heavy plan; recovery may need extra attention");
  }

  return warnings;
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
    isRecommended: template.id === recommendedTemplateId,
    matchReasons: getWorkoutTemplateMatchReasons(template, answers),
    score: getTemplateRecommendationScore(template, answers),
    tags: getWorkoutTemplateTags(template, answers, recommendedTemplateId),
    template,
    warnings: getWorkoutTemplateWarnings(template, answers),
  }));
}
