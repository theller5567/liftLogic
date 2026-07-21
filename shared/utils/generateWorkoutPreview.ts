import type { ExerciseKey, WeightUnit } from "../constants/weightEstimationRules";
import { weightEstimationRules } from "../constants/weightEstimationRules";
import {
  exerciseLibrary,
  type ExerciseDefinition,
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
  getBodyMassIndex,
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
  warnings?: GeneratedWorkoutExerciseWarning[];
  detailTags?: string[];
  editMetadata?: GeneratedWorkoutExerciseEditMetadata;
  exerciseAlternatives: GeneratedWorkoutExerciseAlternative[];
};

export type GeneratedWorkoutExerciseWarning = {
  type: "missing_equipment";
  message: string;
};

export type GeneratedWorkoutExerciseAlternative = {
  exerciseId: string;
  label: string;
  note?: string;
};

export type GeneratedWorkoutExerciseEditMetadata = {
  swapSource?: "recommended" | "custom";
  originalExerciseId?: string;
  originalLabel?: string;
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

type WeightEstimateResult = {
  weight: number;
  wasPrescriptionCapped?: boolean;
};

function getWeightUnit(answers: OnboardingAnswers): WeightUnit {
  return answers.weightUnit ?? "lb";
}

function getPrescriptionTopReps(reps: string): number | null {
  const matches = reps.match(/\d+/g);

  if (!matches?.length) {
    return null;
  }

  return Math.max(...matches.map(Number));
}

function getMultiSetReserveMultiplier(sets: number): number {
  if (sets >= 4) {
    return 0.84;
  }

  if (sets === 3) {
    return 0.88;
  }

  return 0.92;
}

function getFirstWeekConfidenceBuffer(
  confidence: EstimateDirectWeightParams["confidence"]
) {
  switch (confidence) {
    case "high":
      return 0.95;
    case "medium":
      return 0.9;
    case "low":
      return 0.85;
    default:
      return 0.9;
  }
}

function estimatePrescriptionCappedStartingWeight({
  directEstimate,
  equipmentType,
  prescription,
  weightUnit,
}: {
  directEstimate: Pick<
    EstimateDirectWeightParams,
    "estimatedWeight" | "estimatedReps" | "confidence"
  >;
  equipmentType: ReturnType<typeof getExerciseEquipmentType>;
  prescription: WorkoutSetPrescription;
  weightUnit: WeightUnit;
}) {
  const targetReps = getPrescriptionTopReps(prescription.reps);

  if (!targetReps) {
    return null;
  }

  const estimatedOneRepMax =
    directEstimate.estimatedWeight * (1 + directEstimate.estimatedReps / 30);
  const targetRepWeight = estimatedOneRepMax / (1 + targetReps / 30);
  const rawWeight =
    targetRepWeight *
    getMultiSetReserveMultiplier(prescription.sets) *
    getFirstWeekConfidenceBuffer(directEstimate.confidence);
  const increment = weightEstimationRules.rounding[weightUnit][equipmentType];
  const rounded = roundToIncrement(rawWeight, increment);

  return applyMinimum(rounded, weightUnit, equipmentType);
}

function isBenchDerivedDumbbellPress(exerciseKey: ExerciseKey) {
  return (
    exerciseKey === "dumbbell_bench_press" ||
    exerciseKey === "incline_bench_press"
  );
}

function isCompoundPressingExercise(
  exercise: ExerciseDefinition | null | undefined
) {
  return (
    Boolean(exercise?.isCompound) &&
    (exercise?.movementPattern === "horizontal_press" ||
      exercise?.movementPattern === "vertical_press")
  );
}

function getPressingFatigueMultiplier(
  exercise: ExerciseDefinition | null | undefined,
  previousExercises: GeneratedWorkoutExercisePreview[]
) {
  if (!isCompoundPressingExercise(exercise)) {
    return 1;
  }

  const previousPressCount = previousExercises.filter((previousExercise) =>
    isCompoundPressingExercise(getExerciseById(previousExercise.exerciseId))
  ).length;

  if (previousPressCount >= 2) {
    return 0.9;
  }

  if (previousPressCount === 1) {
    return 0.95;
  }

  return 1;
}

function applyDayFatigueGuidance({
  exercise,
  exerciseKey,
  previousExercises,
  weight,
  weightUnit,
}: {
  exercise: ExerciseDefinition | null | undefined;
  exerciseKey: ExerciseKey;
  previousExercises: GeneratedWorkoutExercisePreview[];
  weight: number;
  weightUnit: WeightUnit;
}) {
  const multiplier = getPressingFatigueMultiplier(exercise, previousExercises);

  if (multiplier === 1) {
    return weight;
  }

  const equipmentType = getExerciseEquipmentType(exerciseKey);
  const increment = weightEstimationRules.rounding[weightUnit][equipmentType];
  const rounded = roundToIncrement(weight * multiplier, increment);

  return applyMinimum(rounded, weightUnit, equipmentType);
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

  const bodyMassIndex = getBodyMassIndex(answers);
  const shouldUseBodySizeConservatism =
    answers.experienceLevel === "beginner" ||
    answers.recentTrainingConsistency === "brand_new" ||
    answers.recentTrainingConsistency === "inconsistent";

  if (bodyMassIndex !== undefined && shouldUseBodySizeConservatism) {
    if (bodyMassIndex >= 40) {
      multiplier *= 0.9;
    } else if (bodyMassIndex >= 35) {
      multiplier *= 0.95;
    }
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
  prescription: WorkoutSetPrescription,
  answers: OnboardingAnswers,
  cache: Map<ExerciseKey, WeightEstimateResult>,
  stack: Set<ExerciseKey>
): WeightEstimateResult {
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
    cache.set(exerciseKey, { weight: guidedFallback });
    return { weight: guidedFallback };
  }

  stack.add(exerciseKey);

  const directEstimate = getDirectEstimateForExercise(exerciseKey, answers);

  let suggestedWeight: number;
  let wasPrescriptionCapped = false;

  if (directEstimate) {
    const weightUnit = getWeightUnit(answers);
    const prescriptionCappedWeight = estimatePrescriptionCappedStartingWeight({
      directEstimate,
      equipmentType: getExerciseEquipmentType(exerciseKey),
      prescription,
      weightUnit,
    });
    const legacyEstimate = resolveStartingWeight({
      exerciseKey,
      weightUnit,
      experienceLevel: getRequestedLevel(answers),
      directEstimate,
    });

    suggestedWeight = Math.min(prescriptionCappedWeight ?? legacyEstimate, legacyEstimate);
    wasPrescriptionCapped =
      prescriptionCappedWeight !== null && suggestedWeight < legacyEstimate;
  } else {
    const derivedRule =
      weightEstimationRules.derivedFrom[
        exerciseKey as keyof typeof weightEstimationRules.derivedFrom
      ];

    if (derivedRule) {
      const sourceEstimate = resolveSuggestedWeightForExercise(
        derivedRule.source,
        prescription,
        answers,
        cache,
        stack
      );

      if (
        derivedRule.source === "bench_press" &&
        isBenchDerivedDumbbellPress(exerciseKey)
      ) {
        const weightUnit = getWeightUnit(answers);
        const increment = weightEstimationRules.rounding[weightUnit].dumbbell;
        suggestedWeight = applyMinimum(
          roundToIncrement(sourceEstimate.weight * 0.35, increment),
          weightUnit,
          "dumbbell"
        );
        wasPrescriptionCapped = sourceEstimate.wasPrescriptionCapped ?? false;
      } else {
        suggestedWeight = resolveStartingWeight({
          exerciseKey,
          weightUnit: getWeightUnit(answers),
          experienceLevel: getRequestedLevel(answers),
          derivedSourceWeight: sourceEstimate.weight,
        });
        wasPrescriptionCapped = sourceEstimate.wasPrescriptionCapped ?? false;
      }
    } else {
      suggestedWeight = resolveStartingWeight({
        exerciseKey,
        weightUnit: getWeightUnit(answers),
        experienceLevel: getRequestedLevel(answers),
      });
    }
  }

  suggestedWeight = applyProfileWeightGuidance(suggestedWeight, exerciseKey, answers);

  const result = { weight: suggestedWeight, wasPrescriptionCapped };
  cache.set(exerciseKey, result);
  stack.delete(exerciseKey);

  return result;
}

export function getPrescriptionForExercise(
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

function getExerciseLabel(exerciseId: string) {
  const exercise = getExerciseById(exerciseId);

  return exercise?.displayName ?? exercise?.name ?? exerciseId;
}

function getExerciseAlternatives(exercise: ExerciseDefinition | null | undefined) {
  return (exercise?.alternatives ?? []).map((alternative) => {
    const alternativeExercise = getExerciseById(alternative.exerciseId);

    return {
      exerciseId: alternative.exerciseId,
      label:
        alternativeExercise?.displayName ??
        alternativeExercise?.name ??
        alternative.exerciseId,
      ...(alternative.note ? { note: alternative.note } : {}),
    };
  });
}

function arePrescriptionsEqual(
  left: WorkoutSetPrescription,
  right: WorkoutSetPrescription
) {
  return (
    left.sets === right.sets &&
    left.reps === right.reps &&
    left.restSeconds === right.restSeconds &&
    left.intensity === right.intensity
  );
}

export function buildExerciseReplacementPreview({
  answers,
  currentExercise,
  goal,
  nextExerciseId,
  swapSource,
}: {
  answers: OnboardingAnswers;
  currentExercise: GeneratedWorkoutExercisePreview;
  goal: WorkoutGoal;
  nextExerciseId: string;
  swapSource: "recommended" | "custom";
}): GeneratedWorkoutExercisePreview {
  const currentDefinition = getExerciseById(currentExercise.exerciseId);
  const nextDefinition = getExerciseById(nextExerciseId);
  const nextLabel = getExerciseLabel(nextExerciseId);
  const currentEstimatorKey = normalizeLibraryIdToEstimatorKey(
    currentExercise.exerciseId
  );
  const nextEstimatorKey = normalizeLibraryIdToEstimatorKey(nextExerciseId);
  const hasSameEstimatorKey =
    Boolean(currentEstimatorKey && nextEstimatorKey) &&
    currentEstimatorKey === nextEstimatorKey;
  const hasSameMovementPattern =
    Boolean(currentDefinition && nextDefinition) &&
    currentDefinition?.movementPattern === nextDefinition?.movementPattern;
  const nextPrescription = getPrescriptionForExercise(nextExerciseId, goal, answers);
  const shouldKeepCurrentPrescription =
    hasSameEstimatorKey && hasSameMovementPattern;
  const prescription = shouldKeepCurrentPrescription
    ? currentExercise.prescription
    : nextPrescription;
  const weightCache = new Map<ExerciseKey, WeightEstimateResult>();
  const notes = [
    swapSource === "custom"
      ? "Custom swap selected outside recommended alternatives."
      : undefined,
    !arePrescriptionsEqual(currentExercise.prescription, prescription)
      ? "Prescription was updated for the selected exercise."
      : undefined,
    currentExercise.suggestedWeight !== undefined && !hasSameEstimatorKey
      ? "Weight was reset because this exercise uses a different movement pattern."
      : undefined,
    ...getExerciseSelectionNotes({
      exercise: nextDefinition,
      originalExercise: currentDefinition,
    }),
    getExerciseNotes(nextExerciseId, answers),
    !nextEstimatorKey ? "Choose a comfortable starting load." : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  const nextPreview: GeneratedWorkoutExercisePreview = {
    ...currentExercise,
    exerciseId: nextExerciseId,
    label: nextLabel,
    prescription,
    ...(notes ? { notes } : { notes: undefined }),
    detailTags: getExerciseDetailTags(nextDefinition),
    editMetadata: {
      swapSource,
      originalExerciseId:
        currentExercise.editMetadata?.originalExerciseId ??
        currentExercise.exerciseId,
      originalLabel:
        currentExercise.editMetadata?.originalLabel ?? currentExercise.label,
    },
    exerciseAlternatives: getExerciseAlternatives(nextDefinition),
  };

  if (hasSameEstimatorKey && currentExercise.suggestedWeight !== undefined) {
    return {
      ...nextPreview,
      suggestedWeight: currentExercise.suggestedWeight,
      weightUnit: currentExercise.weightUnit ?? getWeightUnit(answers),
    };
  }

  if (!nextEstimatorKey) {
    const { suggestedWeight, weightUnit, ...previewWithoutWeight } = nextPreview;
    void suggestedWeight;
    void weightUnit;
    return previewWithoutWeight;
  }

  return {
    ...nextPreview,
    suggestedWeight: resolveSuggestedWeightForExercise(
      nextEstimatorKey,
      prescription,
      answers,
      weightCache,
      new Set()
    ).weight,
    weightUnit: getWeightUnit(answers),
  };
}

function buildExercisePreview(
  exerciseId: string,
  dayId: string,
  exerciseIndex: number,
  goal: WorkoutGoal,
  answers: OnboardingAnswers,
  cache: Map<ExerciseKey, WeightEstimateResult>,
  previousExercises: GeneratedWorkoutExercisePreview[]
): GeneratedWorkoutExercisePreview {
  const availableEquipment = getAvailableEquipmentFromAnswers(answers);
  const originalExercise = getExerciseById(exerciseId);
  const usedExerciseIds = new Set(
    previousExercises.map((previousExercise) => previousExercise.exerciseId)
  );
  const compatibleAlternative = getBestCompatibleAlternative({
    answers,
    availableEquipment,
    excludedExerciseIds: usedExerciseIds,
    exerciseId,
  });
  const isRepeatedExercise = usedExerciseIds.has(exerciseId);
  const shouldSubstitute =
    originalExercise &&
    (!canPerformExercise(exerciseId, availableEquipment) || isRepeatedExercise) &&
    compatibleAlternative;
  const resolvedExerciseId = shouldSubstitute
    ? compatibleAlternative.alternative.exerciseId
    : exerciseId;
  const exercise = getExerciseById(resolvedExerciseId);
  const label = getExerciseLabel(resolvedExerciseId);
  const exerciseAlternatives = getExerciseAlternatives(exercise);
  const estimateFrom = normalizeLibraryIdToEstimatorKey(resolvedExerciseId);
  const missingEquipment = getMissingEquipmentLabels(exerciseId, availableEquipment);
  const substitutionNote =
    shouldSubstitute && originalExercise && !isRepeatedExercise
      ? `Substituted for ${originalExercise.displayName ?? originalExercise.name} because your equipment list does not include: ${missingEquipment.join(", ")}.`
      : undefined;
  const duplicateSubstitutionNote =
    shouldSubstitute && originalExercise && isRepeatedExercise
      ? `Substituted for ${originalExercise.displayName ?? originalExercise.name} to avoid repeating the same exercise in one workout.`
      : undefined;
  const duplicateWarningNote =
    !shouldSubstitute && originalExercise && isRepeatedExercise
      ? `${originalExercise.displayName ?? originalExercise.name} appears more than once in this workout because no compatible alternative was available.`
      : undefined;
  const missingEquipmentNote =
    !shouldSubstitute && missingEquipment.length
      ? `Equipment warning: Requires ${missingEquipment.join(", ")}.`
      : undefined;
  const warnings: GeneratedWorkoutExerciseWarning[] =
    !shouldSubstitute && missingEquipment.length
      ? [
          {
            type: "missing_equipment",
            message: `Requires ${missingEquipment.join(", ")}.`,
          },
        ]
      : [];
  const notes = [
    substitutionNote,
    duplicateSubstitutionNote,
    ...getExerciseSelectionNotes({
      exercise,
      originalExercise: shouldSubstitute ? originalExercise : null,
    }),
    missingEquipmentNote,
    duplicateWarningNote,
    getExerciseNotes(resolvedExerciseId, answers),
  ]
    .filter(Boolean)
    .join(" ");
  const prescription = getPrescriptionForExercise(resolvedExerciseId, goal, answers);
  const basePreview = {
    id: `${dayId}_${exerciseIndex + 1}_${resolvedExerciseId}`,
    exerciseId: resolvedExerciseId,
    label,
    prescription,
    ...(notes ? { notes } : {}),
    ...(warnings.length ? { warnings } : {}),
    detailTags: getExerciseDetailTags(exercise),
    exerciseAlternatives,
  };

  if (!estimateFrom) {
    return basePreview;
  }

  const estimate = resolveSuggestedWeightForExercise(
    estimateFrom,
    prescription,
    answers,
    cache,
    new Set()
  );
  const suggestedWeight = applyDayFatigueGuidance({
    exercise,
    exerciseKey: estimateFrom,
    previousExercises,
    weight: estimate.weight,
    weightUnit: getWeightUnit(answers),
  });
  const calibrationNote = estimate.wasPrescriptionCapped
    ? `Estimated from your onboarding answer and adjusted for ${prescription.sets} working sets.`
    : undefined;
  const finalNotes = [basePreview.notes, calibrationNote].filter(Boolean).join(" ");

  return {
    ...basePreview,
    ...(finalNotes ? { notes: finalNotes } : {}),
    suggestedWeight,
    weightUnit: getWeightUnit(answers),
  };
}

function buildDayPreview(
  day: WorkoutTemplateWorkoutDay,
  template: WorkoutTemplate,
  answers: OnboardingAnswers,
  cache: Map<ExerciseKey, WeightEstimateResult>
): GeneratedWorkoutDayPreview {
  const goal = getTemplateGoal(template);

  const exercises = day.exerciseIds.reduce<GeneratedWorkoutExercisePreview[]>(
    (currentExercises, exerciseId, exerciseIndex) => [
      ...currentExercises,
      buildExercisePreview(
        exerciseId,
        day.id,
        exerciseIndex,
        goal,
        answers,
        cache,
        currentExercises
      ),
    ],
    []
  );

  return {
    id: day.id,
    label: day.label,
    focus: template.focus,
    exercises,
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
  const weightCache = new Map<ExerciseKey, WeightEstimateResult>();
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
