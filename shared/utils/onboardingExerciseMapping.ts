import type { ExerciseKey, EquipmentType } from "../constants/weightEstimationRules";
import { getDisplayNameForCanonicalKey } from "./exerciseLibraryAdapter";
import type { OnboardingAnswers } from "../types/onboarding.types";

export type EquipmentAccess = NonNullable<OnboardingAnswers["equipmentAccess"]>;

export type OnboardingAnchorKey =
  | "benchPress"
  | "dumbbellRow"
  | "squat"
  | "barbellDeadlift";

export interface OnboardingAnchorDefinition {
  anchor: OnboardingAnchorKey;
  canonicalExerciseKey: ExerciseKey;
  equipmentNeeded: EquipmentType;
  role: "primary_push" | "primary_pull" | "primary_squat" | "primary_hinge";
}

export interface ExerciseCoverageRow {
  exercise: string;
  canonicalKey: ExerciseKey;
  equipmentType: EquipmentType;
  availableFor: Record<EquipmentAccess, boolean>;
  directOnboardingAnchor: OnboardingAnchorKey | null;
  derivesFrom: ExerciseKey | null;
}

export const equipmentAccessCapabilities: Record<EquipmentAccess, EquipmentType[]> = {
  full_gym: ["barbell", "dumbbell", "machine", "cable"],
  home_gym: ["barbell", "dumbbell"],
  dumbbells_only: ["dumbbell"],
  basic_equipment: ["dumbbell"],
};

export const onboardingAnchorDefinitions: OnboardingAnchorDefinition[] = [
  {
    anchor: "benchPress",
    canonicalExerciseKey: "bench_press",
    equipmentNeeded: "barbell",
    role: "primary_push",
  },
  {
    anchor: "dumbbellRow",
    canonicalExerciseKey: "dumbbell_row",
    equipmentNeeded: "dumbbell",
    role: "primary_pull",
  },
  {
    anchor: "squat",
    canonicalExerciseKey: "squat",
    equipmentNeeded: "barbell",
    role: "primary_squat",
  },
  {
    anchor: "barbellDeadlift",
    canonicalExerciseKey: "deadlift",
    equipmentNeeded: "barbell",
    role: "primary_hinge",
  },
];

const canUse = (equipmentType: EquipmentType, access: EquipmentAccess): boolean =>
  equipmentAccessCapabilities[access].includes(equipmentType);

export const exerciseCoverageTable: ExerciseCoverageRow[] = [
  {
    exercise: getDisplayNameForCanonicalKey("bench_press"),
    canonicalKey: "bench_press",
    equipmentType: "barbell",
    availableFor: {
      full_gym: true,
      home_gym: true,
      dumbbells_only: false,
      basic_equipment: false,
    },
    directOnboardingAnchor: "benchPress",
    derivesFrom: null,
  },
  {
    exercise: getDisplayNameForCanonicalKey("incline_bench_press"),
    canonicalKey: "incline_bench_press",
    equipmentType: "barbell",
    availableFor: {
      full_gym: true,
      home_gym: true,
      dumbbells_only: false,
      basic_equipment: false,
    },
    directOnboardingAnchor: null,
    derivesFrom: "bench_press",
  },
  {
    exercise: getDisplayNameForCanonicalKey("dumbbell_bench_press"),
    canonicalKey: "dumbbell_bench_press",
    equipmentType: "dumbbell",
    availableFor: {
      full_gym: true,
      home_gym: true,
      dumbbells_only: true,
      basic_equipment: true,
    },
    directOnboardingAnchor: null,
    derivesFrom: "bench_press",
  },
  {
    exercise: getDisplayNameForCanonicalKey("chest_press_machine"),
    canonicalKey: "chest_press_machine",
    equipmentType: "machine",
    availableFor: {
      full_gym: true,
      home_gym: false,
      dumbbells_only: false,
      basic_equipment: false,
    },
    directOnboardingAnchor: null,
    derivesFrom: "bench_press",
  },
  {
    exercise: getDisplayNameForCanonicalKey("overhead_press"),
    canonicalKey: "overhead_press",
    equipmentType: "barbell",
    availableFor: {
      full_gym: true,
      home_gym: true,
      dumbbells_only: false,
      basic_equipment: false,
    },
    directOnboardingAnchor: null,
    derivesFrom: null,
  },
  {
    exercise: "Dumbbell Shoulder Press",
    canonicalKey: "dumbbell_shoulder_press",
    equipmentType: "dumbbell",
    availableFor: {
      full_gym: true,
      home_gym: true,
      dumbbells_only: true,
      basic_equipment: true,
    },
    directOnboardingAnchor: null,
    derivesFrom: "overhead_press",
  },
  {
    exercise: "Lateral Raise",
    canonicalKey: "lateral_raise",
    equipmentType: "dumbbell",
    availableFor: {
      full_gym: true,
      home_gym: true,
      dumbbells_only: true,
      basic_equipment: true,
    },
    directOnboardingAnchor: null,
    derivesFrom: null,
  },
  {
    exercise: getDisplayNameForCanonicalKey("barbell_row"),
    canonicalKey: "barbell_row",
    equipmentType: "barbell",
    availableFor: {
      full_gym: true,
      home_gym: true,
      dumbbells_only: false,
      basic_equipment: false,
    },
    directOnboardingAnchor: null,
    derivesFrom: null,
  },
  {
    exercise: getDisplayNameForCanonicalKey("dumbbell_row"),
    canonicalKey: "dumbbell_row",
    equipmentType: "dumbbell",
    availableFor: {
      full_gym: true,
      home_gym: true,
      dumbbells_only: true,
      basic_equipment: true,
    },
    directOnboardingAnchor: "dumbbellRow",
    derivesFrom: null,
  },
  {
    exercise: "Machine Row",
    canonicalKey: "machine_row",
    equipmentType: "machine",
    availableFor: {
      full_gym: true,
      home_gym: false,
      dumbbells_only: false,
      basic_equipment: false,
    },
    directOnboardingAnchor: null,
    derivesFrom: "dumbbell_row",
  },
  {
    exercise: "Seated Cable Row",
    canonicalKey: "seated_cable_row",
    equipmentType: "cable",
    availableFor: {
      full_gym: true,
      home_gym: false,
      dumbbells_only: false,
      basic_equipment: false,
    },
    directOnboardingAnchor: null,
    derivesFrom: "dumbbell_row",
  },
  {
    exercise: getDisplayNameForCanonicalKey("lat_pulldown"),
    canonicalKey: "lat_pulldown",
    equipmentType: "machine",
    availableFor: {
      full_gym: true,
      home_gym: false,
      dumbbells_only: false,
      basic_equipment: false,
    },
    directOnboardingAnchor: null,
    derivesFrom: "dumbbell_row",
  },
  {
    exercise: "Squat",
    canonicalKey: "squat",
    equipmentType: "barbell",
    availableFor: {
      full_gym: true,
      home_gym: true,
      dumbbells_only: false,
      basic_equipment: false,
    },
    directOnboardingAnchor: "squat",
    derivesFrom: null,
  },
  {
    exercise: getDisplayNameForCanonicalKey("goblet_squat"),
    canonicalKey: "goblet_squat",
    equipmentType: "dumbbell",
    availableFor: {
      full_gym: true,
      home_gym: true,
      dumbbells_only: true,
      basic_equipment: true,
    },
    directOnboardingAnchor: null,
    derivesFrom: "squat",
  },
  {
    exercise: getDisplayNameForCanonicalKey("leg_press"),
    canonicalKey: "leg_press",
    equipmentType: "machine",
    availableFor: {
      full_gym: true,
      home_gym: false,
      dumbbells_only: false,
      basic_equipment: false,
    },
    directOnboardingAnchor: null,
    derivesFrom: "squat",
  },
  {
    exercise: "Split Squat",
    canonicalKey: "split_squat",
    equipmentType: "dumbbell",
    availableFor: {
      full_gym: true,
      home_gym: true,
      dumbbells_only: true,
      basic_equipment: true,
    },
    directOnboardingAnchor: null,
    derivesFrom: "squat",
  },
  {
    exercise: getDisplayNameForCanonicalKey("deadlift"),
    canonicalKey: "deadlift",
    equipmentType: "barbell",
    availableFor: {
      full_gym: true,
      home_gym: true,
      dumbbells_only: false,
      basic_equipment: false,
    },
    directOnboardingAnchor: "barbellDeadlift",
    derivesFrom: null,
  },
  {
    exercise: "Romanian Deadlift",
    canonicalKey: "romanian_deadlift",
    equipmentType: "barbell",
    availableFor: {
      full_gym: true,
      home_gym: true,
      dumbbells_only: false,
      basic_equipment: false,
    },
    directOnboardingAnchor: null,
    derivesFrom: "deadlift",
  },
  {
    exercise: "Stiff Leg Deadlift",
    canonicalKey: "stiff_leg_deadlift",
    equipmentType: "barbell",
    availableFor: {
      full_gym: true,
      home_gym: true,
      dumbbells_only: false,
      basic_equipment: false,
    },
    directOnboardingAnchor: null,
    derivesFrom: "deadlift",
  },
  {
    exercise: "Bicep Curl",
    canonicalKey: "bicep_curl",
    equipmentType: "dumbbell",
    availableFor: {
      full_gym: true,
      home_gym: true,
      dumbbells_only: true,
      basic_equipment: true,
    },
    directOnboardingAnchor: null,
    derivesFrom: null,
  },
  {
    exercise: getDisplayNameForCanonicalKey("tricep_pushdown"),
    canonicalKey: "tricep_pushdown",
    equipmentType: "cable",
    availableFor: {
      full_gym: true,
      home_gym: false,
      dumbbells_only: false,
      basic_equipment: false,
    },
    directOnboardingAnchor: null,
    derivesFrom: null,
  },
];

export const exerciseCoverageMarkdownTable = [
  "| Exercise | Canonical key | Equipment type | Full gym | Home gym | Dumbbells only | Basic equipment | Direct onboarding anchor | Can derive from |",
  "|---|---|---|---:|---:|---:|---:|---|---|",
  ...exerciseCoverageTable.map((row) =>
    [
      row.exercise,
      `\`${row.canonicalKey}\``,
      row.equipmentType,
      row.availableFor.full_gym ? "yes" : "no",
      row.availableFor.home_gym ? "yes" : "no",
      row.availableFor.dumbbells_only ? "yes" : "no",
      row.availableFor.basic_equipment ? "yes" : "no",
      row.directOnboardingAnchor ?? "—",
      row.derivesFrom ? `\`${row.derivesFrom}\`` : "—",
    ].join(" | ")
  ).map((line) => `| ${line} |`),
].join("\n");

export function getEligibleExercisesForEquipmentAccess(
  equipmentAccess: EquipmentAccess
): ExerciseKey[] {
  return exerciseCoverageTable
    .filter((row) => row.availableFor[equipmentAccess])
    .map((row) => row.canonicalKey);
}

export function getPrimaryExerciseForAnchor(
  anchor: OnboardingAnchorKey
): ExerciseKey {
  const match = onboardingAnchorDefinitions.find((entry) => entry.anchor === anchor);

  if (!match) {
    throw new Error(`Unknown onboarding anchor: ${anchor}`);
  }

  return match.canonicalExerciseKey;
}

export function isExerciseAvailableForEquipmentAccess(
  exerciseKey: ExerciseKey,
  equipmentAccess: EquipmentAccess
): boolean {
  const row = exerciseCoverageTable.find((entry) => entry.canonicalKey === exerciseKey);

  if (!row) {
    return canUse("dumbbell", equipmentAccess);
  }

  return row.availableFor[equipmentAccess];
}
