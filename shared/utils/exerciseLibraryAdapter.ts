import type { ExerciseKey } from "../constants/weightEstimationRules";
import {
  exerciseLibrary,
  type ExerciseAlternativeRef,
  type ExerciseDefinition,
} from "../constants/exercise-library";

const exercisesById = new Map(
  exerciseLibrary.exercises.map((exercise) => [exercise.id, exercise] as const)
);

const exercisesByCanonicalKey = new Map<ExerciseKey, ExerciseDefinition[]>();

for (const exercise of exerciseLibrary.exercises) {
  if (!exercise.canonicalEstimatorKey) {
    continue;
  }

  const current = exercisesByCanonicalKey.get(exercise.canonicalEstimatorKey) ?? [];
  current.push(exercise);
  exercisesByCanonicalKey.set(exercise.canonicalEstimatorKey, current);
}

const preferredLibraryIdsByCanonicalKey: Partial<Record<ExerciseKey, string>> = {
  bench_press: "barbell_bench_press",
  incline_bench_press: "incline_bench_press",
  dumbbell_bench_press: "flat_dumbbell_press",
  chest_press_machine: "flat_hammer_machine_press",
  overhead_press: "standing_overhead_press",
  barbell_row: "barbell_row",
  dumbbell_row: "dumbbell_row",
  lat_pulldown: "lat_pulldown",
  leg_press: "leg_press",
  goblet_squat: "goblet_squat",
  deadlift: "deadlift",
  tricep_pushdown: "bar_tricep_pushdown",
};

function getPreferredExercise(canonicalKey: ExerciseKey): ExerciseDefinition | null {
  const preferredId = preferredLibraryIdsByCanonicalKey[canonicalKey];

  if (preferredId) {
    const preferred = exercisesById.get(preferredId);
    if (preferred) {
      return preferred;
    }
  }

  return exercisesByCanonicalKey.get(canonicalKey)?.[0] ?? null;
}

export function getExerciseById(id: string): ExerciseDefinition | null {
  return exercisesById.get(id) ?? null;
}

export function getExercisesByCanonicalKey(canonicalKey: ExerciseKey): ExerciseDefinition[] {
  return exercisesByCanonicalKey.get(canonicalKey) ?? [];
}

export function getPrimaryExerciseForCanonicalKey(
  canonicalKey: ExerciseKey
): ExerciseDefinition | null {
  return getPreferredExercise(canonicalKey);
}

export function normalizeLibraryIdToEstimatorKey(id: string): ExerciseKey | null {
  return exercisesById.get(id)?.canonicalEstimatorKey ?? null;
}

export function getDisplayNameForCanonicalKey(canonicalKey: ExerciseKey): string {
  const exercise = getPreferredExercise(canonicalKey);
  return exercise?.displayName ?? exercise?.name ?? canonicalKey;
}

export function getPluralDisplayNameForCanonicalKey(canonicalKey: ExerciseKey): string {
  const exercise = getPreferredExercise(canonicalKey);
  return exercise?.pluralDisplayName ?? exercise?.displayName ?? exercise?.name ?? canonicalKey;
}

export function getVerbPhraseForCanonicalKey(canonicalKey: ExerciseKey): string {
  const exercise = getPreferredExercise(canonicalKey);
  return exercise?.verbPhrase ?? exercise?.displayName ?? exercise?.name ?? canonicalKey;
}

export function getAlternativesForCanonicalKey(
  canonicalKey: ExerciseKey
): ExerciseAlternativeRef[] {
  return getPreferredExercise(canonicalKey)?.alternatives ?? [];
}
