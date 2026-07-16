import {
  exerciseLibrary,
  type ExerciseDefinition,
  type EquipmentType,
} from "../constants/exercise-library";
import type { WorkoutFocusBlock } from "../types/workoutFocus.types";
import {
  WORKOUT_FOCUS_AREA_LABELS,
  type WorkoutFocusArea,
} from "../types/workoutFocus.types";
import type {
  GeneratedWorkoutExerciseAlternative,
  GeneratedWorkoutExercisePreview,
  GeneratedWorkoutPreview,
} from "./generateWorkoutPreview";
import {
  getDifficultyFitScore,
  getExerciseDetailTags,
  getFocusRelevanceScore,
  isCoreCompoundExercise,
  isExerciseTooAdvancedForLevel,
  isIsolationExercise,
} from "./exerciseIntelligence";
import { getExerciseById } from "./exerciseLibraryAdapter";

const CURATED_FOCUS_POOLS: Partial<Record<WorkoutFocusArea, string[]>> = {
  glutes: [
    "barbell_hip_thrust",
    "glute_focused_step_up",
    "bulgarian_split_squat",
    "dumbbell_lunge",
    "barbell_lunge",
    "reverse_lunge",
    "walking_lunge",
    "single_leg_hip_thrust",
    "cable_pull_through",
    "sumo_deadlift",
    "trap_bar_deadlift",
    "dumbbell_romanian_deadlift",
    "back_extension",
  ],
};

const MAINTENANCE_CORE_KEEP_COUNT = 2;

export const getFocusBlockEndDate = (startedAt: Date, durationWeeks: number) => {
  const endsAt = new Date(startedAt);
  endsAt.setDate(endsAt.getDate() + durationWeeks * 7);
  return endsAt;
};

export const createWorkoutFocusBlock = ({
  durationWeeks,
  focusArea,
  now = new Date(),
  reviewedPreview,
}: {
  durationWeeks: WorkoutFocusBlock["durationWeeks"];
  focusArea: WorkoutFocusArea;
  now?: Date;
  reviewedPreview?: GeneratedWorkoutPreview;
}): WorkoutFocusBlock => ({
  durationWeeks,
  focusArea,
  startedAt: now.toISOString(),
  endsAt: getFocusBlockEndDate(now, durationWeeks).toISOString(),
  reviewedPreview,
});

export const isWorkoutFocusBlockActive = (
  focusBlock: WorkoutFocusBlock | null | undefined,
  now = new Date()
) => {
  if (!focusBlock) {
    return false;
  }

  const startedAt = new Date(focusBlock.startedAt).getTime();
  const endsAt = new Date(focusBlock.endsAt).getTime();
  const current = now.getTime();

  return Number.isFinite(startedAt) && Number.isFinite(endsAt)
    ? startedAt <= current && current < endsAt
    : false;
};

export const getWorkoutFocusLabel = (focusArea: WorkoutFocusArea) =>
  WORKOUT_FOCUS_AREA_LABELS[focusArea] ?? focusArea;

export const getWorkoutFocusTargetDayCount = (
  preview: Pick<GeneratedWorkoutPreview, "days"> | null | undefined
) => {
  const dayCount = preview?.days.length ?? 0;

  return Math.min(dayCount, dayCount <= 3 ? dayCount : 3);
};

const getExerciseFocusScore = (
  exercise: ExerciseDefinition | null | undefined,
  focusArea: WorkoutFocusArea
) => {
  if (!exercise) {
    return 0;
  }

  return getFocusRelevanceScore(exercise, focusArea);
};

const isCoreExercise = (exercise: ExerciseDefinition | null | undefined) =>
  isCoreCompoundExercise(exercise);

const isDayFocused = (
  exercises: GeneratedWorkoutExercisePreview[],
  focusArea: WorkoutFocusArea
) =>
  exercises.some((exercise) => getExerciseFocusScore(getExerciseById(exercise.exerciseId), focusArea) > 0);

const hasPrimaryFocusExercise = (
  exercises: GeneratedWorkoutExercisePreview[],
  focusArea: WorkoutFocusArea
) =>
  exercises.some(
    (exercise) =>
      getExerciseById(exercise.exerciseId)?.primaryMuscles.includes(focusArea) ??
      false
  );

const toAlternativeFromRef = ({
  exerciseId,
  note,
}: {
  exerciseId: string;
  note?: string;
}): GeneratedWorkoutExerciseAlternative => {
  const exercise = getExerciseById(exerciseId);

  return {
    exerciseId,
    label: exercise?.displayName ?? exercise?.name ?? exerciseId,
    note,
  };
};

const getBestAlternative = (
  exercise: GeneratedWorkoutExercisePreview,
  focusArea: WorkoutFocusArea,
  usedExerciseIds: Set<string>,
  level: NonNullable<GeneratedWorkoutPreview["level"][number]>
) => {
  const currentExercise = getExerciseById(exercise.exerciseId);
  const alternatives = exercise.exerciseAlternatives
    .map((alternative) => getExerciseById(alternative.exerciseId))
    .filter((alternative): alternative is ExerciseDefinition =>
      Boolean(alternative && !usedExerciseIds.has(alternative.id))
    )
    .sort(
      (left, right) =>
        getExerciseFocusScore(right, focusArea) -
          getExerciseFocusScore(left, focusArea) ||
        getDifficultyFitScore(right, level) - getDifficultyFitScore(left, level) ||
        getEquipmentMatchScore(right, currentExercise?.equipmentType) -
          getEquipmentMatchScore(left, currentExercise?.equipmentType)
    );

  const bestAlternative = alternatives[0];

  return getExerciseFocusScore(bestAlternative, focusArea) > 0
    ? bestAlternative
    : null;
};

const getCuratedFocusPool = (focusArea: WorkoutFocusArea) => {
  const curatedPool = CURATED_FOCUS_POOLS[focusArea]
    ?.map((exerciseId) => getExerciseById(exerciseId))
    .filter((exercise): exercise is ExerciseDefinition => Boolean(exercise));

  if (curatedPool?.length) {
    return curatedPool;
  }

  return exerciseLibrary.exercises
    .filter((exercise) => getExerciseFocusScore(exercise, focusArea) > 0)
    .sort(
      (left, right) =>
        getExerciseFocusScore(right, focusArea) -
        getExerciseFocusScore(left, focusArea)
    );
};

const getEquipmentMatchScore = (
  candidate: ExerciseDefinition,
  currentEquipment: EquipmentType | undefined
) => {
  if (!currentEquipment) {
    return 0;
  }

  if (candidate.equipmentType === currentEquipment) {
    return 3;
  }

  if (candidate.equipmentType === "mixed" || currentEquipment === "mixed") {
    return 2;
  }

  if (
    (candidate.equipmentType === "barbell" ||
      candidate.equipmentType === "dumbbell") &&
    (currentEquipment === "barbell" || currentEquipment === "dumbbell")
  ) {
    return 1;
  }

  return 0;
};

const getBestFocusPoolSwap = (
  exerciseToReplace: GeneratedWorkoutExercisePreview,
  focusArea: WorkoutFocusArea,
  usedExerciseIds: Set<string>,
  allowDuplicate: boolean,
  level: NonNullable<GeneratedWorkoutPreview["level"][number]>
) => {
  const currentExercise = getExerciseById(exerciseToReplace.exerciseId);
  const focusPool = getCuratedFocusPool(focusArea);

  if (focusPool.length === 0) {
    return null;
  }

  const candidates = focusPool
    .filter(
      (candidate) =>
        candidate.id !== exerciseToReplace.exerciseId &&
        (allowDuplicate || !usedExerciseIds.has(candidate.id))
    )
    .sort(
      (left, right) =>
        getExerciseFocusScore(right, focusArea) -
          getExerciseFocusScore(left, focusArea) ||
        Number(isIsolationExercise(right)) - Number(isIsolationExercise(left)) ||
        getDifficultyFitScore(right, level) - getDifficultyFitScore(left, level) ||
        getEquipmentMatchScore(right, currentExercise?.equipmentType) -
          getEquipmentMatchScore(left, currentExercise?.equipmentType) ||
        Number(isExerciseTooAdvancedForLevel(left, level)) -
          Number(isExerciseTooAdvancedForLevel(right, level)) ||
        Number(left.movementPattern !== currentExercise?.movementPattern) -
          Number(right.movementPattern !== currentExercise?.movementPattern)
    );

  return candidates[0] ?? null;
};

const withExerciseSwap = (
  exercise: GeneratedWorkoutExercisePreview,
  swap: ExerciseDefinition,
  focusArea: WorkoutFocusArea
): GeneratedWorkoutExercisePreview => ({
  ...exercise,
  exerciseId: swap.id,
  label: swap.displayName ?? swap.name,
  notes: isIsolationExercise(swap)
    ? `Good accessory movement for your ${getWorkoutFocusLabel(focusArea).toLowerCase()} focus block.`
    : `Focus swap for ${getWorkoutFocusLabel(focusArea).toLowerCase()}.`,
  prescription: exercise.prescription,
  suggestedWeight:
    swap.canonicalEstimatorKey === getExerciseById(exercise.exerciseId)?.canonicalEstimatorKey
      ? exercise.suggestedWeight
      : undefined,
  exerciseAlternatives:
    swap.alternatives.length > 0 ? swap.alternatives.map(toAlternativeFromRef) : [],
  detailTags: getExerciseDetailTags(swap),
});

const getReplacementIndex = (
  exercises: GeneratedWorkoutExercisePreview[],
  focusArea: WorkoutFocusArea,
  protectedCoreSlots: number
) => {
  const replacementCandidates = exercises
    .map((exercise, index) => ({
      index,
      definition: getExerciseById(exercise.exerciseId),
      score: getExerciseFocusScore(getExerciseById(exercise.exerciseId), focusArea),
    }))
    .filter(({ score }) => score === 0)
    .map((candidate) => {
      const isCore = isCoreExercise(candidate.definition);

      return {
        ...candidate,
        priority:
          isIsolationExercise(candidate.definition)
            ? 0
            : !isCore
              ? 1
              : candidate.index < protectedCoreSlots
                ? 3
                : 2,
      };
    })
    .sort((left, right) => left.priority - right.priority || right.index - left.index);

  return replacementCandidates[0]?.index ?? -1;
};

const getTargetFocusDayIndexes = (
  preview: GeneratedWorkoutPreview,
  focusArea: WorkoutFocusArea
) => {
  const targetCount = getWorkoutFocusTargetDayCount(preview);
  const focusedDayIndexes = preview.days
    .map((day, index) => ({
      index,
      isFocused: isDayFocused(day.exercises, focusArea),
    }))
    .filter(({ isFocused }) => isFocused)
    .map(({ index }) => index);
  const targetIndexes = new Set(focusedDayIndexes.slice(0, targetCount));

  for (let index = 0; index < preview.days.length && targetIndexes.size < targetCount; index += 1) {
    targetIndexes.add(index);
  }

  return targetIndexes;
};

export const applyWorkoutFocusBlock = (
  preview: GeneratedWorkoutPreview,
  focusBlock: WorkoutFocusBlock | null | undefined,
  now = new Date()
): GeneratedWorkoutPreview => {
  if (!isWorkoutFocusBlockActive(focusBlock, now)) {
    return preview;
  }

  const activeFocusBlock = focusBlock as WorkoutFocusBlock;

  if (activeFocusBlock.reviewedPreview) {
    return activeFocusBlock.reviewedPreview;
  }

  const focusArea = activeFocusBlock.focusArea;
  const usedExerciseIds = new Set(
    preview.days.flatMap((day) => day.exercises.map((exercise) => exercise.exerciseId))
  );
  const targetFocusDayIndexes = getTargetFocusDayIndexes(preview, focusArea);
  const level = preview.level[0] ?? "intermediate";

  return {
    ...preview,
    label: `${preview.label} (${getWorkoutFocusLabel(focusArea)} specialization)`,
    days: preview.days.map((day, dayIndex) => {
      const exercises = [...day.exercises];
      const shouldPrioritizeFocus = targetFocusDayIndexes.has(dayIndex);
      const shouldReplaceForFocus =
        shouldPrioritizeFocus && !hasPrimaryFocusExercise(exercises, focusArea);

      if (!shouldPrioritizeFocus || !shouldReplaceForFocus) {
        return {
          ...day,
          focus: shouldPrioritizeFocus
            ? `${getWorkoutFocusLabel(focusArea)} specialization • ${day.focus}`
            : `${day.focus} • Maintenance`,
        };
      }

      const replacementIndex = getReplacementIndex(
        exercises,
        focusArea,
        MAINTENANCE_CORE_KEEP_COUNT
      );

      if (replacementIndex === -1) {
        return {
          ...day,
          focus: `${getWorkoutFocusLabel(focusArea)} specialization • ${day.focus}`,
        };
      }

      const currentExercise = exercises[replacementIndex];
      const swap =
        getBestAlternative(currentExercise, focusArea, usedExerciseIds, level) ??
        getBestFocusPoolSwap(currentExercise, focusArea, usedExerciseIds, false, level) ??
        getBestFocusPoolSwap(currentExercise, focusArea, usedExerciseIds, true, level);

      if (!swap) {
        return {
          ...day,
          focus: `${getWorkoutFocusLabel(focusArea)} specialization • ${day.focus}`,
        };
      }

      usedExerciseIds.delete(currentExercise.exerciseId);
      usedExerciseIds.add(swap.id);
      exercises[replacementIndex] = withExerciseSwap(
        currentExercise,
        swap,
        focusArea
      );

      return {
        ...day,
        focus: `${getWorkoutFocusLabel(focusArea)} specialization • ${day.focus}`,
        exercises,
      };
    }),
  };
};

export const getIntroducedFocusExerciseIds = (
  basePreview: GeneratedWorkoutPreview,
  focusedPreview: GeneratedWorkoutPreview
) => {
  const baseExercisesBySlotId = new Map(
    basePreview.days.flatMap((day) =>
      day.exercises.map((exercise) => [exercise.id, exercise] as const)
    )
  );

  return new Set(
    focusedPreview.days
      .flatMap((day) => day.exercises)
      .filter((exercise) => {
        const baseExercise = baseExercisesBySlotId.get(exercise.id);

        return baseExercise?.exerciseId !== exercise.exerciseId;
      })
      .map((exercise) => exercise.id)
  );
};
