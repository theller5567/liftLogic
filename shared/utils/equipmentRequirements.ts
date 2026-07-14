import {
  equipmentLabelsById,
  fallbackEquipmentByType,
  getPresetEquipmentItems,
  normalizeEquipmentItems,
  type EquipmentItemId,
  type EquipmentPresetId,
} from "../constants/equipmentCatalog";
import type { ExerciseDefinition } from "../constants/exercise-library";
import type { OnboardingAnswers } from "../types/onboarding.types";
import type { UserSettings } from "../types/userSettings.types";
import { getExerciseById } from "./exerciseLibraryAdapter";

export type ExerciseEquipmentRequirement = {
  required: EquipmentItemId[];
  oneOf?: EquipmentItemId[][];
};

const benchOption: EquipmentItemId[][] = [["flat_bench"], ["adjustable_bench"]];

const explicitRequirementsByExerciseId: Partial<
  Record<string, ExerciseEquipmentRequirement>
> = {
  back_squat: {
    required: ["barbell", "weight_plates", "squat_rack"],
  },
  barbell_bench_press: {
    required: ["barbell", "weight_plates"],
    oneOf: benchOption,
  },
  barbell_hip_thrust: {
    required: ["barbell", "weight_plates"],
    oneOf: benchOption,
  },
  barbell_lunge: {
    required: ["barbell", "weight_plates", "squat_rack"],
  },
  barbell_row: {
    required: ["barbell", "weight_plates"],
  },
  barbell_seal_row: {
    required: ["barbell", "weight_plates"],
    oneOf: benchOption,
  },
  below_knee_rack_pull: {
    required: ["barbell", "weight_plates", "squat_rack"],
  },
  box_squat: {
    required: ["barbell", "weight_plates", "squat_rack"],
  },
  deadlift: {
    required: ["barbell", "weight_plates"],
  },
  flat_dumbbell_press: {
    required: ["dumbbells"],
    oneOf: benchOption,
  },
  flat_smith_machine_bench_press: {
    required: ["smith_machine", "flat_bench"],
  },
  front_squat: {
    required: ["barbell", "weight_plates", "squat_rack"],
  },
  incline_bench_press: {
    required: ["barbell", "weight_plates", "adjustable_bench"],
  },
  incline_dumbbell_press: {
    required: ["dumbbells", "adjustable_bench"],
  },
  incline_lying_skullcrusher_barbell: {
    required: ["barbell", "weight_plates", "adjustable_bench"],
  },
  incline_smith_machine_press: {
    required: ["smith_machine", "adjustable_bench"],
  },
  leg_press: {
    required: ["leg_press"],
  },
  leg_press_calf_raise: {
    required: ["leg_press"],
  },
  lying_leg_curl: {
    required: ["leg_curl_machine"],
  },
  seated_leg_curl: {
    required: ["leg_curl_machine"],
  },
  seated_row: {
    required: ["cable_machine"],
  },
  smith_machine_calf_raise: {
    required: ["smith_machine"],
  },
  smith_machine_hip_thrust: {
    required: ["smith_machine"],
    oneOf: benchOption,
  },
  smith_machine_stationary_lunge: {
    required: ["smith_machine"],
  },
  standing_calf_raise_machine: {
    required: ["calf_raise_machine"],
  },
  standing_overhead_press: {
    required: ["barbell", "weight_plates"],
  },
  sumo_deadlift: {
    required: ["barbell", "weight_plates"],
  },
  trap_bar_deadlift: {
    required: ["barbell", "weight_plates"],
  },
  weighted_smith_machine_calf_raise: {
    required: ["smith_machine"],
  },
};

function getFallbackRequirement(
  exercise: ExerciseDefinition
): ExerciseEquipmentRequirement {
  if (exercise.equipmentType === "bench") {
    return {
      required: [],
      oneOf: benchOption,
    };
  }

  return {
    required: fallbackEquipmentByType[exercise.equipmentType],
  };
}

export function getExerciseEquipmentRequirement(
  exerciseId: string
): ExerciseEquipmentRequirement {
  const exercise = getExerciseById(exerciseId);

  if (!exercise) {
    return { required: [] };
  }

  return explicitRequirementsByExerciseId[exerciseId] ?? getFallbackRequirement(exercise);
}

export function getAvailableEquipmentFromAnswers(
  answers: Pick<OnboardingAnswers, "availableEquipment" | "equipmentAccess">
): EquipmentItemId[] {
  const exactEquipment = normalizeEquipmentItems(answers.availableEquipment);

  return exactEquipment.length
    ? exactEquipment
    : getPresetEquipmentItems(answers.equipmentAccess as EquipmentPresetId | undefined);
}

export function getAvailableEquipmentFromSettings(
  settings: Pick<UserSettings, "equipmentInventory">,
  answers?: Pick<OnboardingAnswers, "availableEquipment" | "equipmentAccess">
): EquipmentItemId[] {
  const settingsEquipment = normalizeEquipmentItems(settings.equipmentInventory);

  if (settingsEquipment.length) {
    return settingsEquipment;
  }

  return answers ? getAvailableEquipmentFromAnswers(answers) : getPresetEquipmentItems("full_gym");
}

export function getMissingEquipment(
  requirement: ExerciseEquipmentRequirement,
  availableEquipment: EquipmentItemId[]
): EquipmentItemId[] {
  const available = new Set(availableEquipment);
  const missingRequired = requirement.required.filter((item) => !available.has(item));
  const missingOneOf =
    requirement.oneOf?.some((option) => option.every((item) => available.has(item))) === false
      ? requirement.oneOf[0]
      : [];

  return [...new Set([...missingRequired, ...missingOneOf])];
}

export function canPerformExercise(
  exerciseId: string,
  availableEquipment: EquipmentItemId[]
): boolean {
  return getMissingEquipment(
    getExerciseEquipmentRequirement(exerciseId),
    availableEquipment
  ).length === 0;
}

export function getMissingEquipmentLabels(
  exerciseId: string,
  availableEquipment: EquipmentItemId[]
): string[] {
  return getMissingEquipment(
    getExerciseEquipmentRequirement(exerciseId),
    availableEquipment
  ).map((item) => equipmentLabelsById[item]);
}

export function getEquipmentCompatibilityRatio(
  exerciseIds: string[],
  availableEquipment: EquipmentItemId[]
): number {
  if (exerciseIds.length === 0) {
    return 1;
  }

  const compatibleCount = exerciseIds.filter((exerciseId) =>
    canPerformExercise(exerciseId, availableEquipment)
  ).length;

  return compatibleCount / exerciseIds.length;
}
