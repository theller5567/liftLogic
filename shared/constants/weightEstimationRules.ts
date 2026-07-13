export type ExperienceLevel = "beginner" | "intermediate" | "advanced";
export type ConfidenceLevel = "high" | "medium" | "low";
export type WeightUnit = "lb" | "kg";
export type EquipmentType =
  | "barbell"
  | "dumbbell"
  | "machine"
  | "cable"
  | "bodyweight_assisted";

export type ExerciseKey =
  | "bench_press"
  | "incline_bench_press"
  | "dumbbell_bench_press"
  | "chest_press_machine"
  | "overhead_press"
  | "dumbbell_shoulder_press"
  | "lateral_raise"
  | "barbell_row"
  | "dumbbell_row"
  | "machine_row"
  | "seated_cable_row"
  | "lat_pulldown"
  | "squat"
  | "front_squat"
  | "goblet_squat"
  | "leg_press"
  | "deadlift"
  | "romanian_deadlift"
  | "stiff_leg_deadlift"
  | "split_squat"
  | "barbell_hip_thrust"
  | "single_leg_weighted_calf_raise"
  | "leg_press_calf_raise"
  | "bicep_curl"
  | "tricep_pushdown";

export interface RepMultiplierRange {
  min: number;
  max: number;
  multiplier: number;
}

export interface ExerciseDefaultMap {
  beginner: number;
  intermediate: number;
  advanced: number;
}

export interface DerivedExerciseRule {
  source: ExerciseKey;
  multiplier: number;
  equipmentType: EquipmentType;
  note?: string;
}

export interface ExerciseMeta {
  equipmentType: EquipmentType;
  category: "compound" | "isolation";
}

export const weightEstimationRules = {
  version: 1,

  multipliers: {
    experience: {
      beginner: 0.85,
      intermediate: 0.92,
      advanced: 0.97,
    } satisfies Record<ExperienceLevel, number>,

    confidence: {
      high: 1.0,
      medium: 0.95,
      low: 0.9,
    } satisfies Record<ConfidenceLevel, number>,

    reps: [
      { min: 1, max: 5, multiplier: 0.85 },
      { min: 6, max: 8, multiplier: 0.9 },
      { min: 9, max: 12, multiplier: 0.95 },
      { min: 13, max: 30, multiplier: 0.9 },
    ] satisfies RepMultiplierRange[],
  },

  rounding: {
    lb: {
      barbell: 5,
      dumbbell: 5,
      machine: 5,
      cable: 5,
      bodyweight_assisted: 5,
    },
    kg: {
      barbell: 2.5,
      dumbbell: 2.5,
      machine: 2.5,
      cable: 2.5,
      bodyweight_assisted: 2.5,
    },
  } satisfies Record<WeightUnit, Record<EquipmentType, number>>,

  minimums: {
    lb: {
      barbell: 45,
      dumbbell: 5,
      machine: 5,
      cable: 5,
      bodyweight_assisted: 5,
    },
    kg: {
      barbell: 20,
      dumbbell: 2.5,
      machine: 2.5,
      cable: 2.5,
      bodyweight_assisted: 2.5,
    },
  } satisfies Record<WeightUnit, Record<EquipmentType, number>>,

  defaults: {
    lb: {
      bench_press: { beginner: 45, intermediate: 75, advanced: 115 },
      incline_bench_press: { beginner: 45, intermediate: 65, advanced: 95 },
      dumbbell_bench_press: { beginner: 20, intermediate: 35, advanced: 50 },
      chest_press_machine: { beginner: 40, intermediate: 70, advanced: 110 },

      overhead_press: { beginner: 35, intermediate: 55, advanced: 75 },
      dumbbell_shoulder_press: { beginner: 15, intermediate: 25, advanced: 40 },
      lateral_raise: { beginner: 10, intermediate: 15, advanced: 20 },

      barbell_row: { beginner: 45, intermediate: 85, advanced: 135 },
      dumbbell_row: { beginner: 25, intermediate: 45, advanced: 70 },
      machine_row: { beginner: 40, intermediate: 75, advanced: 120 },
      seated_cable_row: { beginner: 40, intermediate: 70, advanced: 110 },
      lat_pulldown: { beginner: 40, intermediate: 70, advanced: 110 },

      squat: { beginner: 45, intermediate: 95, advanced: 145 },
      front_squat: { beginner: 45, intermediate: 75, advanced: 115 },
      goblet_squat: { beginner: 20, intermediate: 35, advanced: 50 },
      leg_press: { beginner: 90, intermediate: 180, advanced: 270 },
      split_squat: { beginner: 15, intermediate: 25, advanced: 40 },

      deadlift: { beginner: 65, intermediate: 135, advanced: 225 },
      romanian_deadlift: { beginner: 55, intermediate: 105, advanced: 165 },
      stiff_leg_deadlift: { beginner: 55, intermediate: 95, advanced: 155 },
      barbell_hip_thrust: { beginner: 65, intermediate: 115, advanced: 185 },
      single_leg_weighted_calf_raise: { beginner: 10, intermediate: 20, advanced: 35 },
      leg_press_calf_raise: { beginner: 45, intermediate: 90, advanced: 135 },

      bicep_curl: { beginner: 15, intermediate: 25, advanced: 35 },
      tricep_pushdown: { beginner: 30, intermediate: 50, advanced: 80 },
    } satisfies Record<ExerciseKey, ExerciseDefaultMap>,

    kg: {
      bench_press: { beginner: 20, intermediate: 35, advanced: 52.5 },
      incline_bench_press: { beginner: 20, intermediate: 30, advanced: 42.5 },
      dumbbell_bench_press: { beginner: 10, intermediate: 16, advanced: 22.5 },
      chest_press_machine: { beginner: 18, intermediate: 32, advanced: 50 },

      overhead_press: { beginner: 15, intermediate: 25, advanced: 35 },
      dumbbell_shoulder_press: { beginner: 6, intermediate: 12, advanced: 18 },
      lateral_raise: { beginner: 4, intermediate: 6, advanced: 10 },

      barbell_row: { beginner: 20, intermediate: 40, advanced: 60 },
      dumbbell_row: { beginner: 12, intermediate: 20, advanced: 32 },
      machine_row: { beginner: 18, intermediate: 34, advanced: 54 },
      seated_cable_row: { beginner: 18, intermediate: 32, advanced: 50 },
      lat_pulldown: { beginner: 18, intermediate: 32, advanced: 50 },

      squat: { beginner: 20, intermediate: 42.5, advanced: 65 },
      front_squat: { beginner: 20, intermediate: 35, advanced: 52.5 },
      goblet_squat: { beginner: 10, intermediate: 16, advanced: 22.5 },
      leg_press: { beginner: 40, intermediate: 80, advanced: 120 },
      split_squat: { beginner: 6, intermediate: 12, advanced: 18 },

      deadlift: { beginner: 30, intermediate: 60, advanced: 100 },
      romanian_deadlift: { beginner: 25, intermediate: 47.5, advanced: 75 },
      stiff_leg_deadlift: { beginner: 25, intermediate: 42.5, advanced: 70 },
      barbell_hip_thrust: { beginner: 30, intermediate: 52.5, advanced: 82.5 },
      single_leg_weighted_calf_raise: { beginner: 5, intermediate: 10, advanced: 16 },
      leg_press_calf_raise: { beginner: 20, intermediate: 40, advanced: 60 },

      bicep_curl: { beginner: 6, intermediate: 10, advanced: 16 },
      tricep_pushdown: { beginner: 14, intermediate: 24, advanced: 36 },
    } satisfies Record<ExerciseKey, ExerciseDefaultMap>,
  },

  derivedFrom: {
    incline_bench_press: {
      source: "bench_press",
      multiplier: 0.9,
      equipmentType: "barbell",
    },
    dumbbell_bench_press: {
      source: "bench_press",
      multiplier: 0.4,
      equipmentType: "dumbbell",
      note: "Per dumbbell weight",
    },
    chest_press_machine: {
      source: "bench_press",
      multiplier: 1.0,
      equipmentType: "machine",
    },
    dumbbell_shoulder_press: {
      source: "overhead_press",
      multiplier: 0.45,
      equipmentType: "dumbbell",
      note: "Per dumbbell weight",
    },
    seated_cable_row: {
      source: "dumbbell_row",
      multiplier: 1.55,
      equipmentType: "cable",
    },
    lat_pulldown: {
      source: "dumbbell_row",
      multiplier: 1.55,
      equipmentType: "machine",
    },
    machine_row: {
      source: "dumbbell_row",
      multiplier: 1.65,
      equipmentType: "machine",
    },
    goblet_squat: {
      source: "squat",
      multiplier: 0.25,
      equipmentType: "dumbbell",
      note: "Single dumbbell",
    },
    front_squat: {
      source: "squat",
      multiplier: 0.75,
      equipmentType: "barbell",
    },
    leg_press: {
      source: "squat",
      multiplier: 1.8,
      equipmentType: "machine",
    },
    split_squat: {
      source: "squat",
      multiplier: 0.2,
      equipmentType: "dumbbell",
      note: "Per dumbbell weight",
    },
    romanian_deadlift: {
      source: "deadlift",
      multiplier: 0.8,
      equipmentType: "barbell",
    },
    stiff_leg_deadlift: {
      source: "deadlift",
      multiplier: 0.75,
      equipmentType: "barbell",
    },
    barbell_hip_thrust: {
      source: "deadlift",
      multiplier: 0.8,
      equipmentType: "barbell",
    },
    single_leg_weighted_calf_raise: {
      source: "squat",
      multiplier: 0.15,
      equipmentType: "dumbbell",
      note: "Per dumbbell weight",
    },
    leg_press_calf_raise: {
      source: "leg_press",
      multiplier: 0.5,
      equipmentType: "machine",
    },
  } satisfies Partial<Record<ExerciseKey, DerivedExerciseRule>>,

  exerciseMeta: {
    bench_press: { equipmentType: "barbell", category: "compound" },
    incline_bench_press: { equipmentType: "barbell", category: "compound" },
    dumbbell_bench_press: { equipmentType: "dumbbell", category: "compound" },
    chest_press_machine: { equipmentType: "machine", category: "compound" },

    overhead_press: { equipmentType: "barbell", category: "compound" },
    dumbbell_shoulder_press: { equipmentType: "dumbbell", category: "compound" },
    lateral_raise: { equipmentType: "dumbbell", category: "isolation" },

    barbell_row: { equipmentType: "barbell", category: "compound" },
    dumbbell_row: { equipmentType: "dumbbell", category: "compound" },
    machine_row: { equipmentType: "machine", category: "compound" },
    seated_cable_row: { equipmentType: "cable", category: "compound" },
    lat_pulldown: { equipmentType: "machine", category: "compound" },

    squat: { equipmentType: "barbell", category: "compound" },
    front_squat: { equipmentType: "barbell", category: "compound" },
    goblet_squat: { equipmentType: "dumbbell", category: "compound" },
    leg_press: { equipmentType: "machine", category: "compound" },
    split_squat: { equipmentType: "dumbbell", category: "compound" },

    deadlift: { equipmentType: "barbell", category: "compound" },
    romanian_deadlift: { equipmentType: "barbell", category: "compound" },
    stiff_leg_deadlift: { equipmentType: "barbell", category: "compound" },
    barbell_hip_thrust: { equipmentType: "barbell", category: "compound" },
    single_leg_weighted_calf_raise: {
      equipmentType: "dumbbell",
      category: "isolation",
    },
    leg_press_calf_raise: { equipmentType: "machine", category: "isolation" },

    bicep_curl: { equipmentType: "dumbbell", category: "isolation" },
    tricep_pushdown: { equipmentType: "cable", category: "isolation" },
  } satisfies Record<ExerciseKey, ExerciseMeta>,
} as const;
