import type { ExerciseKey, WeightUnit } from "../constants/weightEstimationRules";
import { weightEstimationRules } from "../constants/weightEstimationRules";
import {
  exerciseLibrary,
  type WorkoutTemplate,
  type WorkoutTemplateWorkoutDay,
} from "../constants/exercise-library";
import type { OnboardingAnswers } from "../types/onboarding.types";
import type { OnboardingAnchorKey } from "./onboardingExerciseMapping";
import { onboardingAnchorDefinitions } from "./onboardingExerciseMapping";
import { getExerciseById, normalizeLibraryIdToEstimatorKey } from "./exerciseLibraryAdapter";
import {
  canPerformExercise,
  getAvailableEquipmentFromAnswers,
  getMissingEquipmentLabels,
} from "./equipmentRequirements";
import {
  getBestCompatibleAlternative,
  getExerciseDetailTags,
  getExerciseSelectionNotes,
  isIsolationExercise,
} from "./exerciseIntelligence";

import {
  applyMinimum,
  getExerciseEquipmentType,
  resolveStartingWeight,
  roundToIncrement,
  type EstimateDirectWeightParams,
} from "./weightEstimation";
import {
  getRequestedEquipment,
  getRequestedLevel,
  getSelectedWorkoutTemplate,
  getTemplateGoal,
  getTemplateWorkoutDays,
  type WorkoutEquipment,
  type WorkoutGoal,
  type WorkoutLevel,
} from "./workoutTemplateRecommendations";

export type WorkoutSetPrescription = {
  sets: number;
  reps: string;
  restSeconds: number;
  intensity?: "easy" | "moderate" | "hard";
};

export type GeneratedWorkoutExercisePreview = {
  id: string;
  exerciseId: string;
  label: string;
  prescription: WorkoutSetPrescription;
  suggestedWeight?: number;
  weightUnit?: WeightUnit;
  notes?: string;
  detailTags?: string[];
  exerciseAlternatives: GeneratedWorkoutExerciseAlternative[];
};

export type GeneratedWorkoutExerciseAlternative = {
  exerciseId: string;
  label: string;
  note?: string;
};

export type GeneratedWorkoutDayPreview = {
  id: string;
  label: string;
  focus: string;
  exercises: GeneratedWorkoutExercisePreview[];
};

export type GeneratedWorkoutScheduleDayPreview =
  | {
      day: number;
      type: "workout";
      id: string;
      label: string;
      workoutDayId: string;
    }
  | {
      day: number;
      type: "rest";
      label: string;
    };

export type GeneratedWorkoutPreview = {
  programId: string;
  label: string;
  goal: WorkoutGoal;
  level: WorkoutLevel[];
  equipmentAccess: WorkoutEquipment[];
  daysPerWeek: number;
  weightUnit: WeightUnit;
  days: GeneratedWorkoutDayPreview[];
  weeklySchedule?: GeneratedWorkoutScheduleDayPreview[];
};

type AnchorAnswer = NonNullable<
  | OnboardingAnswers["benchPress"]
  | OnboardingAnswers["dumbbellRow"]
  | OnboardingAnswers["squat"]
  | OnboardingAnswers["barbellDeadlift"]
>;

function getWeightUnit(answers: OnboardingAnswers): WeightUnit {
  return answers.weightUnit ?? "lb";
}

function getProfileWeightMultiplier(answers: OnboardingAnswers): number {
  let multiplier = 1;

  if (answers.ageRange === "7_15") {
    multiplier *= 0.55;
  } else if (answers.ageRange === "16_18") {
    multiplier *= 0.82;
  } else if (answers.ageRange === "40_49") {
    multiplier *= 0.95;
  } else if (answers.ageRange === "50_plus") {
    multiplier *= 0.9;
  }

  if (answers.gender === "female") {
    multiplier *= 0.85;
  }

  return multiplier;
}

function applyProfileWeightGuidance(
  weight: number,
  exerciseKey: ExerciseKey,
  answers: OnboardingAnswers
) {
  const multiplier = getProfileWeightMultiplier(answers);

  if (multiplier === 1) {
    return weight;
  }

  const weightUnit = getWeightUnit(answers);
  const equipmentType = getExerciseEquipmentType(exerciseKey);
  const increment = weightEstimationRules.rounding[weightUnit][equipmentType];
  const rounded = roundToIncrement(weight * multiplier, increment);

  return applyMinimum(rounded, weightUnit, equipmentType);
}

function getAnchorAnswer(
  answers: OnboardingAnswers,
  anchor: OnboardingAnchorKey
): AnchorAnswer | undefined {
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
}

function getDirectEstimateForExercise(
  exerciseKey: ExerciseKey,
  answers: OnboardingAnswers
): Pick<
  EstimateDirectWeightParams,
  "estimatedWeight" | "estimatedReps" | "confidence"
> | undefined {
  const anchorDefinition = onboardingAnchorDefinitions.find(
    (definition) => definition.canonicalExerciseKey === exerciseKey
  );

  if (!anchorDefinition) {
    return undefined;
  }

  const anchorAnswer = getAnchorAnswer(answers, anchorDefinition.anchor);

  if (
    anchorAnswer?.knowsWorkingWeight !== true ||
    anchorAnswer.estimatedWeight === undefined ||
    anchorAnswer.estimatedReps === undefined ||
    anchorAnswer.confidence === undefined
  ) {
    return undefined;
  }

  return {
    estimatedWeight: anchorAnswer.estimatedWeight,
    estimatedReps: anchorAnswer.estimatedReps,
    confidence: anchorAnswer.confidence,
  };
}

function resolveSuggestedWeightForExercise(
  exerciseKey: ExerciseKey,
  answers: OnboardingAnswers,
  cache: Map<ExerciseKey, number>,
  stack: Set<ExerciseKey>
): number {
  const cached = cache.get(exerciseKey);
  if (cached !== undefined) {
    return cached;
  }

  if (stack.has(exerciseKey)) {
    const fallback = resolveStartingWeight({
      exerciseKey,
      weightUnit: getWeightUnit(answers),
      experienceLevel: getRequestedLevel(answers),
    });
    const guidedFallback = applyProfileWeightGuidance(fallback, exerciseKey, answers);
    cache.set(exerciseKey, guidedFallback);
    return guidedFallback;
  }

  stack.add(exerciseKey);

  const directEstimate = getDirectEstimateForExercise(exerciseKey, answers);

  let suggestedWeight: number;

  if (directEstimate) {
    suggestedWeight = resolveStartingWeight({
      exerciseKey,
      weightUnit: getWeightUnit(answers),
      experienceLevel: getRequestedLevel(answers),
      directEstimate,
    });
  } else {
    const derivedRule =
      weightEstimationRules.derivedFrom[
        exerciseKey as keyof typeof weightEstimationRules.derivedFrom
      ];

    if (derivedRule) {
      const sourceWeight = resolveSuggestedWeightForExercise(
        derivedRule.source,
        answers,
        cache,
        stack
      );

      suggestedWeight = resolveStartingWeight({
        exerciseKey,
        weightUnit: getWeightUnit(answers),
        experienceLevel: getRequestedLevel(answers),
        derivedSourceWeight: sourceWeight,
      });
    } else {
      suggestedWeight = resolveStartingWeight({
        exerciseKey,
        weightUnit: getWeightUnit(answers),
        experienceLevel: getRequestedLevel(answers),
      });
    }
  }

  suggestedWeight = applyProfileWeightGuidance(suggestedWeight, exerciseKey, answers);

  cache.set(exerciseKey, suggestedWeight);
  stack.delete(exerciseKey);

  return suggestedWeight;
}

function getPrescriptionForExercise(
  exerciseId: string,
  goal: WorkoutGoal,
  answers: OnboardingAnswers
): WorkoutSetPrescription {
  const exercise = getExerciseById(exerciseId);
  const isIsolation = isIsolationExercise(exercise);
  const isYouth = answers.ageRange === "7_15";
  const isOlder = answers.ageRange === "40_49" || answers.ageRange === "50_plus";
  const prefersHigherReps = answers.gender === "female" || isYouth || isOlder;

  if (isYouth) {
    return {
      sets: isIsolation ? 2 : 3,
      reps: isIsolation ? "12-15" : "10-12",
      restSeconds: isIsolation ? 60 : 120,
      intensity: "easy",
    };
  }

  if (goal === "strength" && !isIsolation) {
    return {
      sets: 3,
      reps: prefersHigherReps ? "6-8" : "3-5",
      restSeconds: 180,
      intensity: isOlder ? "moderate" : "hard",
    };
  }

  if (goal === "strength" && isIsolation) {
    return {
      sets: 2,
      reps: "10-15",
      restSeconds: 60,
      intensity: "moderate",
    };
  }

  if (goal === "hybrid" && !isIsolation) {
    return {
      sets: 3,
      reps: prefersHigherReps ? "8-10" : "5-8",
      restSeconds: 150,
      intensity: "moderate",
    };
  }

  return {
    sets: isIsolation ? 3 : 4,
    reps: isIsolation ? "12-15" : "8-12",
    restSeconds: isIsolation ? 60 : 120,
    intensity: "moderate",
  };
}

function getExerciseNotes(
  exerciseId: string,
  answers: OnboardingAnswers
): string | undefined {
  if (answers.ageRange === "7_15") {
    return "Prioritize perfect form and control before adding substantial weight.";
  }

  const estimatorKey = normalizeLibraryIdToEstimatorKey(exerciseId);
  const derivedRules = weightEstimationRules.derivedFrom as Partial<
    Record<ExerciseKey, { note?: string }>
  >;
  const derivedNote = estimatorKey ? derivedRules[estimatorKey]?.note : undefined;

  if (derivedNote) {
    return derivedNote;
  }

  return undefined;
}

function buildExercisePreview(
  exerciseId: string,
  dayId: string,
  exerciseIndex: number,
  goal: WorkoutGoal,
  answers: OnboardingAnswers,
  cache: Map<ExerciseKey, number>
): GeneratedWorkoutExercisePreview {
  const availableEquipment = getAvailableEquipmentFromAnswers(answers);
  const originalExercise = getExerciseById(exerciseId);
  const compatibleAlternative = getBestCompatibleAlternative({
    answers,
    availableEquipment,
    exerciseId,
  });
  const shouldSubstitute =
    originalExercise &&
    !canPerformExercise(exerciseId, availableEquipment) &&
    compatibleAlternative;
  const resolvedExerciseId = shouldSubstitute
    ? compatibleAlternative.alternative.exerciseId
    : exerciseId;
  const exercise = getExerciseById(resolvedExerciseId);
  const label = exercise?.displayName ?? exercise?.name ?? resolvedExerciseId;
  const exerciseAlternatives = (exercise?.alternatives ?? []).map(
    (alternative) => {
      const alternativeExercise = getExerciseById(alternative.exerciseId);

      return {
        exerciseId: alternative.exerciseId,
        label:
          alternativeExercise?.displayName ??
          alternativeExercise?.name ??
          alternative.exerciseId,
        ...(alternative.note ? { note: alternative.note } : {}),
      };
    }
  );
  const estimateFrom = normalizeLibraryIdToEstimatorKey(resolvedExerciseId);
  const missingEquipment = getMissingEquipmentLabels(exerciseId, availableEquipment);
  const substitutionNote =
    shouldSubstitute && originalExercise
      ? `Substituted for ${originalExercise.displayName ?? originalExercise.name} because your equipment list does not include: ${missingEquipment.join(", ")}.`
      : undefined;
  const missingEquipmentNote =
    !shouldSubstitute && missingEquipment.length
      ? `Missing equipment: ${missingEquipment.join(", ")}.`
      : undefined;
  const notes = [
    substitutionNote,
    ...getExerciseSelectionNotes({
      exercise,
      originalExercise: shouldSubstitute ? originalExercise : null,
    }),
    missingEquipmentNote,
    getExerciseNotes(resolvedExerciseId, answers),
  ]
    .filter(Boolean)
    .join(" ");
  const basePreview = {
    id: `${dayId}_${exerciseIndex + 1}_${resolvedExerciseId}`,
    exerciseId: resolvedExerciseId,
    label,
    prescription: getPrescriptionForExercise(resolvedExerciseId, goal, answers),
    ...(notes ? { notes } : {}),
    detailTags: getExerciseDetailTags(exercise),
    exerciseAlternatives,
  };

  if (!estimateFrom) {
    return basePreview;
  }

  return {
    ...basePreview,
    suggestedWeight: resolveSuggestedWeightForExercise(
      estimateFrom,
      answers,
      cache,
      new Set()
    ),
    weightUnit: getWeightUnit(answers),
  };
}

function buildDayPreview(
  day: WorkoutTemplateWorkoutDay,
  template: WorkoutTemplate,
  answers: OnboardingAnswers,
  cache: Map<ExerciseKey, number>
): GeneratedWorkoutDayPreview {
  const goal = getTemplateGoal(template);

  return {
    id: day.id,
    label: day.label,
    focus: template.focus,
    exercises: day.exerciseIds.map((exerciseId, exerciseIndex) =>
      buildExercisePreview(exerciseId, day.id, exerciseIndex, goal, answers, cache)
    ),
  };
}

function buildWeeklySchedule(
  template: WorkoutTemplate
): GeneratedWorkoutScheduleDayPreview[] {
  return template.workoutDays.map((day) =>
    day.type === "workout"
      ? {
          day: day.day,
          type: "workout",
          id: day.id,
          label: day.label,
          workoutDayId: day.id,
        }
      : {
          day: day.day,
          type: "rest",
          label: day.label,
      }
  );
}

export function resolvePreviewWeeklySchedule(
  preview: Pick<GeneratedWorkoutPreview, "programId" | "weeklySchedule">
): GeneratedWorkoutScheduleDayPreview[] {
  if (preview.weeklySchedule?.length) {
    return preview.weeklySchedule;
  }

  const template = exerciseLibrary.workoutTemplates.find(
    (workoutTemplate) => workoutTemplate.id === preview.programId
  );

  return template ? buildWeeklySchedule(template) : [];
}

export function generateWorkoutPreview(
  answers: OnboardingAnswers
): GeneratedWorkoutPreview {
  const selectedTemplate = getSelectedWorkoutTemplate(answers);
  const weightCache = new Map<ExerciseKey, number>();
  const weightUnit = getWeightUnit(answers);
  const workoutDays = getTemplateWorkoutDays(selectedTemplate);

  return {
    programId: selectedTemplate.id,
    label: selectedTemplate.name,
    goal: getTemplateGoal(selectedTemplate),
    level: [selectedTemplate.experienceLevel],
    equipmentAccess: [getRequestedEquipment(answers)],
    daysPerWeek: selectedTemplate.daysRequired,
    weightUnit,
    days: workoutDays.map((day) =>
      buildDayPreview(day, selectedTemplate, answers, weightCache)
    ),
    weeklySchedule: buildWeeklySchedule(selectedTemplate),
  };
}
