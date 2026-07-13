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

const estimatorKeyFallbacksByLibraryId: Partial<Record<string, ExerciseKey>> = {
  assisted_pull_up_machine: "lat_pulldown",
  barbell_lunge: "split_squat",
  barbell_seal_row: "barbell_row",
  behind_body_cable_curl: "bicep_curl",
  below_knee_rack_pull: "deadlift",
  bent_over_reverse_dumbbell_fly: "dumbbell_row",
  box_squat: "squat",
  bulgarian_split_squat: "split_squat",
  cable_dumbbell_lateral_raise: "lateral_raise",
  cable_pull_through: "romanian_deadlift",
  chest_supported_row: "machine_row",
  decline_dumbbell_press: "dumbbell_bench_press",
  decline_machine_press: "chest_press_machine",
  dumbbell_lunge: "split_squat",
  dumbbell_romanian_deadlift: "romanian_deadlift",
  dumbbell_seal_row: "dumbbell_row",
  dumbbell_seated_calf_raise: "single_leg_weighted_calf_raise",
  glute_focused_step_up: "split_squat",
  glute_ham_raise: "romanian_deadlift",
  hack_squat: "leg_press",
  hammer_curl: "bicep_curl",
  incline_dumbbell_press: "dumbbell_bench_press",
  incline_hammer_press: "chest_press_machine",
  incline_lying_skullcrusher_barbell: "tricep_pushdown",
  incline_overhead_dumbbell_extension: "tricep_pushdown",
  machine_lateral_raise: "lateral_raise",
  machine_shoulder_press: "dumbbell_shoulder_press",
  narrow_grip_bar_curl: "bicep_curl",
  neutral_grip_flat_dumbbell_press: "dumbbell_bench_press",
  reverse_grip_curl: "bicep_curl",
  reverse_lunge: "split_squat",
  reverse_pec_deck: "machine_row",
  rope_cable_curl_neutral: "bicep_curl",
  rope_pushdown: "tricep_pushdown",
  seated_dumbbell_barbell_overhead_press: "dumbbell_shoulder_press",
  seated_dumbbell_press: "dumbbell_shoulder_press",
  seated_leg_curl: "romanian_deadlift",
  seated_row: "seated_cable_row",
  seated_smith_machine_overhead_press: "overhead_press",
  seated_weighted_calf_raise: "single_leg_weighted_calf_raise",
  smith_machine_calf_raise: "leg_press_calf_raise",
  smith_machine_hip_thrust: "barbell_hip_thrust",
  smith_machine_stationary_lunge: "split_squat",
  standing_calf_raise_machine: "leg_press_calf_raise",
  standing_cable_reverse_fly: "seated_cable_row",
  standing_dumbbell_calf_raise: "single_leg_weighted_calf_raise",
  standing_kneeling_face_pull: "seated_cable_row",
  standing_seated_cable_crossover: "chest_press_machine",
  straight_bar_pulldown: "lat_pulldown",
  sumo_deadlift: "deadlift",
  t_bar_row: "barbell_row",
  trap_bar_deadlift: "deadlift",
  walking_lunge: "split_squat",
  weighted_smith_machine_calf_raise: "leg_press_calf_raise",
  wide_grip_seated_row: "seated_cable_row",
};

function inferEstimatorKey(exercise: ExerciseDefinition): ExerciseKey | null {
  if (exercise.equipmentType === "bodyweight") {
    return null;
  }

  switch (exercise.movementPattern) {
    case "squat":
      return exercise.equipmentType === "machine" ||
        exercise.equipmentType === "smith_machine"
        ? "leg_press"
        : "squat";
    case "lunge":
    case "step_up":
      return "split_squat";
    case "hinge":
      return "romanian_deadlift";
    case "hip_thrust":
      return "barbell_hip_thrust";
    case "calf_raise":
      return exercise.equipmentType === "machine" ||
        exercise.equipmentType === "smith_machine"
        ? "leg_press_calf_raise"
        : "single_leg_weighted_calf_raise";
    case "horizontal_press":
      if (exercise.equipmentType === "dumbbell") {
        return "dumbbell_bench_press";
      }

      if (
        exercise.equipmentType === "machine" ||
        exercise.equipmentType === "smith_machine"
      ) {
        return "chest_press_machine";
      }

      return "bench_press";
    case "vertical_press":
      return exercise.equipmentType === "dumbbell" ||
        exercise.equipmentType === "machine"
        ? "dumbbell_shoulder_press"
        : "overhead_press";
    case "horizontal_pull":
      if (exercise.equipmentType === "dumbbell") {
        return "dumbbell_row";
      }

      if (exercise.equipmentType === "barbell") {
        return "barbell_row";
      }

      return exercise.equipmentType === "cable" ? "seated_cable_row" : "machine_row";
    case "vertical_pull":
      return "lat_pulldown";
    case "lateral_raise":
      return "lateral_raise";
    case "curl":
      return "bicep_curl";
    case "triceps_extension":
    case "triceps_pushdown":
      return "tricep_pushdown";
    case "fly":
      return "chest_press_machine";
    case "pullover":
      return "lat_pulldown";
    default:
      return null;
  }
}

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
  const exercise = exercisesById.get(id);

  if (!exercise) {
    return null;
  }

  return (
    exercise.canonicalEstimatorKey ??
    estimatorKeyFallbacksByLibraryId[id] ??
    inferEstimatorKey(exercise)
  );
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
