import {
  exerciseLibrary,
  type EquipmentType as LibraryEquipmentType,
  type WorkoutTemplate,
  type WorkoutTemplateWorkoutDay,
} from "../constants/exercise-library";
import type { OnboardingAnswers } from "../types/onboarding.types";
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

const EQUIPMENT_ACCESS_SCORES: Record<
  WorkoutEquipment,
  Partial<Record<LibraryEquipmentType, number>>
> = {
  full_gym: {
    assisted_machine: 3,
    barbell: 3,
    bench: 3,
    bodyweight: 3,
    cable: 3,
    dumbbell: 3,
    machine: 3,
    mixed: 3,
    other: 2,
    smith_machine: 3,
    swiss_ball: 3,
  },
  home_gym: {
    barbell: 3,
    bench: 3,
    bodyweight: 3,
    cable: 2,
    dumbbell: 3,
    mixed: 2,
    other: 2,
    smith_machine: 1,
    swiss_ball: 2,
  },
  dumbbells_only: {
    bench: 2,
    bodyweight: 3,
    dumbbell: 3,
    mixed: 1,
    other: 1,
    swiss_ball: 1,
  },
  basic_equipment: {
    bench: 1,
    bodyweight: 3,
    dumbbell: 1,
    mixed: 1,
    other: 2,
    swiss_ball: 2,
  },
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
  requestedEquipment: WorkoutEquipment
) {
  const workoutExerciseIds = getTemplateWorkoutDays(template).flatMap(
    (day) => day.exerciseIds
  );

  if (workoutExerciseIds.length === 0) {
    return 0;
  }

  const totalScore = workoutExerciseIds.reduce((score, exerciseId) => {
    const exercise = getExerciseById(exerciseId);

    return (
      score +
      (exercise
        ? EQUIPMENT_ACCESS_SCORES[requestedEquipment][exercise.equipmentType] ?? 0
        : 0)
    );
  }, 0);

  return totalScore / workoutExerciseIds.length;
}

export function getTemplateRecommendationScore(
  template: WorkoutTemplate,
  answers: OnboardingAnswers
) {
  const requestedGoal = getRequestedGoal(answers);
  const requestedLevel = getRequestedLevel(answers);
  const requestedEquipment = getRequestedEquipment(answers);
  const requestedTrainingDays = getRequestedTrainingDays(answers);
  const templateGoal = getTemplateGoal(template);
  const dayDifference = requestedTrainingDays - template.daysRequired;
  const isOverRequestedDays = dayDifference < 0;
  const equipmentScore = getEquipmentCompatibilityScore(template, requestedEquipment);
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

  score += equipmentScore * 90;

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
  const requestedEquipment = answers.equipmentAccess;
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
    requestedEquipment &&
    getEquipmentCompatibilityScore(template, requestedEquipment) < 2
  ) {
    warnings.push("May need equipment you did not select");
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
  const requestedEquipment = answers.equipmentAccess;
  const requestedTrainingDays = answers.availableTrainingDays;
  const templateGoal = getTemplateGoal(template);

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
    requestedEquipment &&
    getEquipmentCompatibilityScore(template, requestedEquipment) >= 2
  ) {
    reasons.push("Fits most of your equipment access");
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
