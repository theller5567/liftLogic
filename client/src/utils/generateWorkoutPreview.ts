import type { ExerciseKey, WeightUnit } from "../../../shared/constants/weightEstimationRules";
import { weightEstimationRules } from "../../../shared/constants/weightEstimationRules";
import type { OnboardingAnswers } from "../../../shared/types/onboarding.types";
import type { OnboardingAnchorKey } from "../../../shared/utils/onboardingExerciseMapping";
import { onboardingAnchorDefinitions } from "../../../shared/utils/onboardingExerciseMapping";
import { getExerciseById } from "../../../shared/utils/exerciseLibraryAdapter";

import {
  resolveStartingWeight,
  type EstimateDirectWeightParams,
} from "./weightEstimation";
import {
  workoutPrograms,
  type WorkoutDayTemplate,
  type WorkoutEquipment,
  type WorkoutExerciseSlot,
  type WorkoutGoal,
  type WorkoutLevel,
  type WorkoutProgramTemplate,
  type WorkoutSetPrescription,
} from "./workoutProgramTemplate";

export type GeneratedWorkoutExercisePreview = {
  id: string;
  exerciseId: string;
  label: string;
  prescription: WorkoutSetPrescription;
  suggestedWeight?: number;
  weightUnit?: WeightUnit;
  notes?: string;
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

export type GeneratedWorkoutPreview = {
  programId: string;
  label: string;
  goal: WorkoutGoal;
  level: WorkoutLevel[];
  equipmentAccess: WorkoutEquipment[];
  daysPerWeek: number;
  weightUnit: WeightUnit;
  days: GeneratedWorkoutDayPreview[];
};

type AnchorAnswer = NonNullable<
  | OnboardingAnswers["benchPress"]
  | OnboardingAnswers["dumbbellRow"]
  | OnboardingAnswers["squat"]
  | OnboardingAnswers["barbellDeadlift"]
>;

function getRequestedGoal(answers: OnboardingAnswers): WorkoutGoal {
  return (answers.goalPriority ?? answers.goal ?? "hypertrophy") as WorkoutGoal;
}

function getRequestedLevel(answers: OnboardingAnswers): WorkoutLevel {
  return answers.experienceLevel ?? "beginner";
}

function getRequestedEquipment(answers: OnboardingAnswers): WorkoutEquipment {
  return answers.equipmentAccess ?? "full_gym";
}

function getWeightUnit(answers: OnboardingAnswers): WeightUnit {
  return answers.weightUnit ?? "lb";
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

function selectStarterProgram(answers: OnboardingAnswers): WorkoutProgramTemplate {
  const requestedGoal = getRequestedGoal(answers);
  const requestedLevel = getRequestedLevel(answers);
  const requestedEquipment = getRequestedEquipment(answers);

  return (
    workoutPrograms.find(
      (program) =>
        program.goal === requestedGoal &&
        program.level.includes(requestedLevel) &&
        program.equipmentAccess.includes(requestedEquipment)
    ) ??
    workoutPrograms.find(
      (program) =>
        program.goal === requestedGoal && program.level.includes(requestedLevel)
    ) ??
    workoutPrograms.find((program) => program.goal === requestedGoal) ??
    workoutPrograms[0]
  );
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
    cache.set(exerciseKey, fallback);
    return fallback;
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

  cache.set(exerciseKey, suggestedWeight);
  stack.delete(exerciseKey);

  return suggestedWeight;
}

function buildExercisePreview(
  slot: WorkoutExerciseSlot,
  answers: OnboardingAnswers,
  cache: Map<ExerciseKey, number>
): GeneratedWorkoutExercisePreview {
  const exercise = getExerciseById(slot.exerciseId);
  const label = slot.label ?? exercise?.displayName ?? exercise?.name ?? slot.exerciseId;
  const exerciseAlternatives = (slot.exerciseAlternatives ?? exercise?.alternatives ?? []).map(
    (alternative) => {
      const alternativeExercise = getExerciseById(alternative.exerciseId);

      return {
        exerciseId: alternative.exerciseId,
        label:
          alternativeExercise?.displayName ??
          alternativeExercise?.name ??
          alternative.exerciseId,
        note: alternative.note,
      };
    }
  );

  if (!slot.estimateFrom) {
    return {
      id: slot.id,
      exerciseId: slot.exerciseId,
      label,
      prescription: slot.prescription,
      notes: slot.notes,
      exerciseAlternatives,
    };
  }

  return {
    id: slot.id,
    exerciseId: slot.exerciseId,
    label,
    prescription: slot.prescription,
    suggestedWeight: resolveSuggestedWeightForExercise(
      slot.estimateFrom,
      answers,
      cache,
      new Set()
    ),
    weightUnit: getWeightUnit(answers),
    notes: slot.notes,
    exerciseAlternatives,
  };
}

function buildDayPreview(
  day: WorkoutDayTemplate,
  answers: OnboardingAnswers,
  cache: Map<ExerciseKey, number>
): GeneratedWorkoutDayPreview {
  return {
    id: day.id,
    label: day.label,
    focus: day.focus,
    exercises: day.exercises.map((slot) => buildExercisePreview(slot, answers, cache)),
  };
}

export function generateWorkoutPreview(
  answers: OnboardingAnswers
): GeneratedWorkoutPreview {
  const selectedProgram = selectStarterProgram(answers);
  const weightCache = new Map<ExerciseKey, number>();
  const weightUnit = getWeightUnit(answers);

  return {
    programId: selectedProgram.id,
    label: selectedProgram.label,
    goal: selectedProgram.goal,
    level: selectedProgram.level,
    equipmentAccess: selectedProgram.equipmentAccess,
    daysPerWeek: selectedProgram.daysPerWeek,
    weightUnit,
    days: selectedProgram.days.map((day) => buildDayPreview(day, answers, weightCache)),
  };
}
