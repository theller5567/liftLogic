import type { ExerciseKey } from "../../../shared/constants/weightEstimationRules";
import type { ExerciseAlternativeRef } from "../../../shared/constants/exercise-library";
import { getExerciseById } from "../../../shared/utils/exerciseLibraryAdapter";

export type WorkoutGoal = "hypertrophy" | "strength" | "hybrid";
export type WorkoutLevel = "beginner" | "intermediate" | "advanced";
export type WorkoutEquipment = "full_gym" | "home_gym" | "dumbbells_only" | "basic_equipment";

export type WorkoutSetPrescription = {
  sets: number;
  reps: string;
  restSeconds: number;
  intensity?: "easy" | "moderate" | "hard";
};

export type WorkoutExerciseSlot = {
  id: string;
  exerciseId: string;
  label?: string;
  prescription: WorkoutSetPrescription;
  estimateFrom?: ExerciseKey;
  notes?: string;
  exerciseAlternatives?: ExerciseAlternativeRef[];
};

export type WorkoutDayTemplate = {
  id: string;
  label: string;
  focus: string;
  exercises: WorkoutExerciseSlot[];
};

export type WorkoutProgramTemplate = {
  id: string;
  label: string;
  goal: WorkoutGoal;
  level: WorkoutLevel[];
  equipmentAccess: WorkoutEquipment[];
  daysPerWeek: number;
  days: WorkoutDayTemplate[];
};




export const workoutPrograms: WorkoutProgramTemplate[] = [
  {
    id: "beginner_full_gym_hypertrophy_3_day",
    label: "Beginner Full Gym Hypertrophy",
    goal: "hypertrophy",
    level: ["beginner"],
    equipmentAccess: ["full_gym", "home_gym"],
    daysPerWeek: 3,
    days: [
      {
        id: "day_1_upper_a",
        label: "Upper A",
        focus: "Pressing, rowing, and shoulder volume",
        exercises: [
          {
            id: "day_1_bench_press",
            exerciseId: "barbell_bench_press",
            label: "Bench Press",
            exerciseAlternatives: getExerciseById("barbell_bench_press")?.alternatives,
            estimateFrom: "bench_press",
            prescription: {
              sets: 4,
              reps: "6-10",
              restSeconds: 150,
              intensity: "moderate",
            },
          },
          {
            id: "day_1_dumbbell_row",
            exerciseId: "dumbbell_row",
            label: "Dumbbell Row",
            exerciseAlternatives: getExerciseById("dumbbell_row")?.alternatives,
            estimateFrom: "dumbbell_row",
            prescription: {
              sets: 4,
              reps: "8-10 each side",
              restSeconds: 90,
              intensity: "moderate",
            },
          },
          {
            id: "day_1_overhead_press",
            exerciseId: "standing_overhead_press",
            label: "Overhead Press",
            exerciseAlternatives: getExerciseById("standing_overhead_press")?.alternatives,
            estimateFrom: "overhead_press",
            prescription: {
              sets: 3,
              reps: "8-10",
              restSeconds: 120,
              intensity: "moderate",
            },
          },
          {
            id: "day_1_lateral_raise",
            exerciseId: "machine_lateral_raise",
            label: "Lateral Raise",
            exerciseAlternatives: getExerciseById("machine_lateral_raise")?.alternatives,
            estimateFrom: "lateral_raise",
            prescription: {
              sets: 3,
              reps: "12-15",
              restSeconds: 60,
              intensity: "moderate",
            },
          },
          {
            id: "day_1_tricep_pushdown",
            exerciseId: "bar_tricep_pushdown",
            label: "Tricep Pushdown",
            exerciseAlternatives: getExerciseById("bar_tricep_pushdown")?.alternatives,
            estimateFrom: "tricep_pushdown",
            prescription: {
              sets: 3,
              reps: "10-15",
              restSeconds: 60,
              intensity: "moderate",
            },
          },
        ],
      },
      {
        id: "day_2_lower",
        label: "Lower",
        focus: "Squat, hinge, and leg volume",
        exercises: [
          {
            id: "day_2_back_squat",
            exerciseId: "back_squat",
            label: "Back Squat",
            exerciseAlternatives: getExerciseById("back_squat")?.alternatives,
            estimateFrom: "squat",
            prescription: {
              sets: 4,
              reps: "6-8",
              restSeconds: 150,
              intensity: "moderate",
            },
          },
          {
            id: "day_2_deadlift",
            exerciseId: "deadlift",
            label: "Barbell Deadlift",
            exerciseAlternatives: getExerciseById("deadlift")?.alternatives,
            estimateFrom: "deadlift",
            prescription: {
              sets: 3,
              reps: "6-8",
              restSeconds: 150,
              intensity: "moderate",
            },
          },
          {
            id: "day_2_leg_press",
            exerciseId: "leg_press",
            label: "Leg Press",
            exerciseAlternatives: getExerciseById("leg_press")?.alternatives,
            estimateFrom: "leg_press",
            prescription: {
              sets: 3,
              reps: "10-12",
              restSeconds: 120,
              intensity: "moderate",
            },
          },
          {
            id: "day_2_calf_raise",
            exerciseId: "seated_weighted_calf_raise",
            label: "Seated Calf Raise",
            exerciseAlternatives: getExerciseById("seated_weighted_calf_raise")?.alternatives,
            prescription: {
              sets: 3,
              reps: "12-15",
              restSeconds: 60,
              intensity: "moderate",
            },
          },
        ],
      },
      {
        id: "day_3_upper_b",
        label: "Upper B",
        focus: "Upper chest, vertical pull, and arms",
        exercises: [
          {
            id: "day_3_incline_bench_press",
            exerciseId: "incline_bench_press",
            label: "Incline Bench Press",
            exerciseAlternatives: getExerciseById("incline_bench_press")?.alternatives,
            estimateFrom: "incline_bench_press",
            prescription: {
              sets: 4,
              reps: "8-10",
              restSeconds: 120,
              intensity: "moderate",
            },
          },
          {
            id: "day_3_lat_pulldown",
            exerciseId: "lat_pulldown",
            label: "Lat Pulldown",
            exerciseAlternatives: getExerciseById("lat_pulldown")?.alternatives,
            estimateFrom: "lat_pulldown",
            prescription: {
              sets: 4,
              reps: "8-12",
              restSeconds: 90,
              intensity: "moderate",
            },
          },
          {
            id: "day_3_flat_dumbbell_press",
            exerciseId: "flat_dumbbell_press",
            label: "Flat Dumbbell Press",
            exerciseAlternatives: getExerciseById("flat_dumbbell_press")?.alternatives,
            estimateFrom: "dumbbell_bench_press",
            prescription: {
              sets: 3,
              reps: "8-12",
              restSeconds: 90,
              intensity: "moderate",
            },
            notes: "Use the estimated per-dumbbell weight.",
          },
          {
            id: "day_3_incline_dumbbell_curl",
            exerciseId: "incline_dumbbell_curl",
            label: "Incline Dumbbell Curl",
            exerciseAlternatives: getExerciseById("incline_dumbbell_curl")?.alternatives,
            estimateFrom: "bicep_curl",
            prescription: {
              sets: 3,
              reps: "10-15",
              restSeconds: 60,
              intensity: "moderate",
            },
            notes: "Use the estimated per-dumbbell weight.",
          },
          {
            id: "day_3_reverse_pec_deck",
            exerciseId: "reverse_pec_deck",
            label: "Reverse Pec Deck",
            exerciseAlternatives: getExerciseById("reverse_pec_deck")?.alternatives,
            prescription: {
              sets: 3,
              reps: "12-15",
              restSeconds: 60,
              intensity: "moderate",
            },
          },
        ],
      },
    ],
  },
  {
    id: "beginner_full_gym_strength_3_day",
    label: "Beginner Full Gym Strength",
    goal: "strength",
    level: ["beginner"],
    equipmentAccess: ["full_gym", "home_gym"],
    daysPerWeek: 3,
    days: [
      {
        id: "day_1_full_body_a",
        label: "Full Body A",
        focus: "Squat, bench, and row strength",
        exercises: [
          {
            id: "day_1_back_squat",
            exerciseId: "back_squat",
            label: "Back Squat",
            exerciseAlternatives: getExerciseById("back_squat")?.alternatives,
            estimateFrom: "squat",
            prescription: {
              sets: 4,
              reps: "4-6",
              restSeconds: 180,
              intensity: "hard",
            },
          },
          {
            id: "day_1_barbell_bench_press",
            exerciseId: "barbell_bench_press",
            label: "Bench Press",
            exerciseAlternatives: getExerciseById("barbell_bench_press")?.alternatives,
            estimateFrom: "bench_press",
            prescription: {
              sets: 4,
              reps: "4-6",
              restSeconds: 180,
              intensity: "hard",
            },
          },
          {
            id: "day_1_dumbbell_row",
            exerciseId: "dumbbell_row",
            label: "Dumbbell Row",
            exerciseAlternatives: getExerciseById("dumbbell_row")?.alternatives,
            estimateFrom: "dumbbell_row",
            prescription: {
              sets: 3,
              reps: "6-10 each side",
              restSeconds: 90,
              intensity: "moderate",
            },
          },
        ],
      },
      {
        id: "day_2_full_body_b",
        label: "Full Body B",
        focus: "Hinge, press, and pull strength",
        exercises: [
          {
            id: "day_2_deadlift",
            exerciseId: "deadlift",
            label: "Barbell Deadlift",
            exerciseAlternatives: getExerciseById("deadlift")?.alternatives,
            estimateFrom: "deadlift",
            prescription: {
              sets: 4,
              reps: "3-5",
              restSeconds: 240,
              intensity: "hard",
            },
          },
          {
            id: "day_2_standing_overhead_press",
            exerciseId: "standing_overhead_press",
            label: "Overhead Press",
            exerciseAlternatives: getExerciseById("standing_overhead_press")?.alternatives,
            estimateFrom: "overhead_press",
            prescription: {
              sets: 4,
              reps: "4-6",
              restSeconds: 180,
              intensity: "hard",
            },
          },
          {
            id: "day_2_lat_pulldown",
            exerciseId: "lat_pulldown",
            label: "Lat Pulldown",
            exerciseAlternatives: getExerciseById("lat_pulldown")?.alternatives,
            estimateFrom: "lat_pulldown",
            prescription: {
              sets: 3,
              reps: "6-10",
              restSeconds: 90,
              intensity: "moderate",
            },
          },
        ],
      },
      {
        id: "day_3_full_body_c",
        label: "Full Body C",
        focus: "Squat, incline press, and heavy row",
        exercises: [
          {
            id: "day_3_back_squat",
            exerciseId: "back_squat",
            label: "Back Squat",
            exerciseAlternatives: getExerciseById("back_squat")?.alternatives,
            estimateFrom: "squat",
            prescription: {
              sets: 4,
              reps: "4-6",
              restSeconds: 180,
              intensity: "hard",
            },
          },
          {
            id: "day_3_incline_bench_press",
            exerciseId: "incline_bench_press",
            label: "Incline Bench Press",
            exerciseAlternatives: getExerciseById("incline_bench_press")?.alternatives,
            estimateFrom: "incline_bench_press",
            prescription: {
              sets: 4,
              reps: "4-6",
              restSeconds: 180,
              intensity: "hard",
            },
          },
          {
            id: "day_3_barbell_row",
            exerciseId: "barbell_row",
            label: "Barbell Row",
            exerciseAlternatives: getExerciseById("barbell_row")?.alternatives,
            estimateFrom: "barbell_row",
            prescription: {
              sets: 4,
              reps: "4-6",
              restSeconds: 150,
              intensity: "hard",
            },
          },
        ],
      },
    ],
  },
  {
    id: "beginner_full_gym_hybrid_3_day",
    label: "Beginner Full Gym Hybrid",
    goal: "hybrid",
    level: ["beginner"],
    equipmentAccess: ["full_gym", "home_gym"],
    daysPerWeek: 3,
    days: [
      {
        id: "day_1_full_body_a",
        label: "Full Body A",
        focus: "Squat, push, pull",
        exercises: [
          {
            id: "day_1_back_squat",
            exerciseId: "back_squat",
            label: "Back Squat",
            exerciseAlternatives: getExerciseById("back_squat")?.alternatives,
            estimateFrom: "squat",
            prescription: {
              sets: 3,
              reps: "5",
              restSeconds: 180,
              intensity: "moderate",
            },
          },
          {
            id: "day_1_barbell_bench_press",
            exerciseId: "barbell_bench_press",
            label: "Bench Press",
            exerciseAlternatives: getExerciseById("barbell_bench_press")?.alternatives,
            estimateFrom: "bench_press",
            prescription: {
              sets: 3,
              reps: "6-8",
              restSeconds: 150,
              intensity: "moderate",
            },
          },
          {
            id: "day_1_dumbbell_row",
            exerciseId: "dumbbell_row",
            label: "Dumbbell Row",
            exerciseAlternatives: getExerciseById("dumbbell_row")?.alternatives,
            estimateFrom: "dumbbell_row",
            prescription: {
              sets: 3,
              reps: "8-10 each side",
              restSeconds: 90,
              intensity: "moderate",
            },
          },
        ],
      },
      {
        id: "day_2_full_body_b",
        label: "Full Body B",
        focus: "Hinge, shoulders, legs",
        exercises: [
          {
            id: "day_2_deadlift",
            exerciseId: "deadlift",
            label: "Barbell Deadlift",
            exerciseAlternatives: getExerciseById("deadlift")?.alternatives,
            estimateFrom: "deadlift",
            prescription: {
              sets: 3,
              reps: "5",
              restSeconds: 180,
              intensity: "moderate",
            },
          },
          {
            id: "day_2_standing_overhead_press",
            exerciseId: "standing_overhead_press",
            label: "Overhead Press",
            exerciseAlternatives: getExerciseById("standing_overhead_press")?.alternatives,
            estimateFrom: "overhead_press",
            prescription: {
              sets: 3,
              reps: "6-8",
              restSeconds: 150,
              intensity: "moderate",
            },
          },
          {
            id: "day_2_leg_press",
            exerciseId: "leg_press",
            label: "Leg Press",
            exerciseAlternatives: getExerciseById("leg_press")?.alternatives,
            estimateFrom: "leg_press",
            prescription: {
              sets: 3,
              reps: "10-12",
              restSeconds: 120,
              intensity: "moderate",
            },
          },
        ],
      },
      {
        id: "day_3_full_body_c",
        label: "Full Body C",
        focus: "Squat variation, incline press, and accessories",
        exercises: [
          {
            id: "day_3_goblet_squat",
            exerciseId: "goblet_squat",
            label: "Goblet Squat",
            exerciseAlternatives: getExerciseById("goblet_squat")?.alternatives,
            estimateFrom: "goblet_squat",
            prescription: {
              sets: 3,
              reps: "8-12",
              restSeconds: 90,
              intensity: "moderate",
            },
            notes: "Use the estimated single-dumbbell weight.",
          },
          {
            id: "day_3_incline_bench_press",
            exerciseId: "incline_bench_press",
            label: "Incline Bench Press",
            exerciseAlternatives: getExerciseById("incline_bench_press")?.alternatives,
            estimateFrom: "incline_bench_press",
            prescription: {
              sets: 3,
              reps: "5-8",
              restSeconds: 150,
              intensity: "moderate",
            },
          },
          {
            id: "day_3_lat_pulldown",
            exerciseId: "lat_pulldown",
            label: "Lat Pulldown",
            exerciseAlternatives: getExerciseById("lat_pulldown")?.alternatives,
            estimateFrom: "lat_pulldown",
            prescription: {
              sets: 3,
              reps: "8-12",
              restSeconds: 90,
              intensity: "moderate",
            },
          },
          {
            id: "day_3_bulgarian_split_squat",
            exerciseId: "bulgarian_split_squat",
            label: "Bulgarian Split Squat",
            exerciseAlternatives: getExerciseById("bulgarian_split_squat")?.alternatives,
            estimateFrom: "split_squat",
            prescription: {
              sets: 2,
              reps: "8-12 each side",
              restSeconds: 75,
              intensity: "moderate",
            },
            notes: "Use the estimated per-dumbbell weight.",
          },
          {
            id: "day_3_lateral_raise",
            exerciseId: "machine_lateral_raise",
            label: "Lateral Raise",
            exerciseAlternatives: getExerciseById("machine_lateral_raise")?.alternatives,
            estimateFrom: "lateral_raise",
            prescription: {
              sets: 2,
              reps: "10-15",
              restSeconds: 60,
              intensity: "moderate",
            },
          },
        ],
      },
    ],
  },
  {
    id: "intermediate_full_gym_hypertrophy_4_day",
    label: "Intermediate Full Gym Hypertrophy",
    goal: "hypertrophy",
    level: ["intermediate"],
    equipmentAccess: ["full_gym", "home_gym"],
    daysPerWeek: 4,
    days: [
      {
        id: "day_1_upper_1",
        label: "Upper 1",
        focus: "Horizontal press and row emphasis",
        exercises: [
          {
            id: "day_1_bench_press",
            exerciseId: "barbell_bench_press",
            label: "Bench Press",
            exerciseAlternatives: getExerciseById("barbell_bench_press")?.alternatives,
            estimateFrom: "bench_press",
            prescription: {
              sets: 4,
              reps: "6-8",
              restSeconds: 150,
              intensity: "hard",
            },
          },
          {
            id: "day_1_chest_supported_row",
            exerciseId: "chest_supported_row",
            label: "Chest Supported Row",
            exerciseAlternatives: getExerciseById("chest_supported_row")?.alternatives,
            estimateFrom: "barbell_row",
            prescription: {
              sets: 4,
              reps: "8-10",
              restSeconds: 120,
              intensity: "moderate",
            },
          },
          {
            id: "day_1_overhead_press",
            exerciseId: "standing_overhead_press",
            label: "Overhead Press",
            exerciseAlternatives: getExerciseById("standing_overhead_press")?.alternatives,
            estimateFrom: "overhead_press",
            prescription: {
              sets: 3,
              reps: "8-10",
              restSeconds: 120,
              intensity: "moderate",
            },
          },
          {
            id: "day_1_lateral_raise",
            exerciseId: "machine_lateral_raise",
            label: "Lateral Raise",
            exerciseAlternatives: getExerciseById("machine_lateral_raise")?.alternatives,
            estimateFrom: "lateral_raise",
            prescription: {
              sets: 3,
              reps: "12-15",
              restSeconds: 60,
              intensity: "moderate",
            },
          },
          {
            id: "day_1_tricep_pushdown",
            exerciseId: "bar_tricep_pushdown",
            label: "Tricep Pushdown",
            exerciseAlternatives: getExerciseById("bar_tricep_pushdown")?.alternatives,
            estimateFrom: "tricep_pushdown",
            prescription: {
              sets: 3,
              reps: "10-15",
              restSeconds: 60,
              intensity: "moderate",
            },
          },
        ],
      },
      {
        id: "day_2_lower_1",
        label: "Lower 1",
        focus: "Squat and posterior chain volume",
        exercises: [
          {
            id: "day_2_back_squat",
            exerciseId: "back_squat",
            label: "Back Squat",
            exerciseAlternatives: getExerciseById("back_squat")?.alternatives,
            estimateFrom: "squat",
            prescription: {
              sets: 4,
              reps: "6-8",
              restSeconds: 150,
              intensity: "hard",
            },
          },
          {
            id: "day_2_deadlift",
            exerciseId: "deadlift",
            label: "Barbell Deadlift",
            exerciseAlternatives: getExerciseById("deadlift")?.alternatives,
            estimateFrom: "deadlift",
            prescription: {
              sets: 3,
              reps: "8-10",
              restSeconds: 150,
              intensity: "moderate",
            },
            notes: "Choose a conservative working weight for the first week.",
          },
          {
            id: "day_2_leg_press",
            exerciseId: "leg_press",
            label: "Leg Press",
            exerciseAlternatives: getExerciseById("leg_press")?.alternatives,
            estimateFrom: "leg_press",
            prescription: {
              sets: 3,
              reps: "10-12",
              restSeconds: 120,
              intensity: "moderate",
            },
          },
          {
            id: "day_2_calf_raise",
            exerciseId: "seated_weighted_calf_raise",
            label: "Seated Calf Raise",
            exerciseAlternatives: getExerciseById("seated_weighted_calf_raise")?.alternatives,
            prescription: {
              sets: 4,
              reps: "12-15",
              restSeconds: 60,
              intensity: "moderate",
            },
          },
        ],
      },
      {
        id: "day_3_upper_2",
        label: "Upper 2",
        focus: "Incline press, pull volume, and arms",
        exercises: [
          {
            id: "day_3_flat_dumbbell_press",
            exerciseId: "flat_dumbbell_press",
            label: "Flat Dumbbell Press",
            exerciseAlternatives: getExerciseById("flat_dumbbell_press")?.alternatives,
            estimateFrom: "dumbbell_bench_press",
            prescription: {
              sets: 4,
              reps: "8-10",
              restSeconds: 120,
              intensity: "moderate",
            },
            notes: "Use the estimated per-dumbbell weight.",
          },
          {
            id: "day_3_lat_pulldown",
            exerciseId: "lat_pulldown",
            label: "Lat Pulldown",
            exerciseAlternatives: getExerciseById("lat_pulldown")?.alternatives,
            estimateFrom: "lat_pulldown",
            prescription: {
              sets: 4,
              reps: "8-12",
              restSeconds: 90,
              intensity: "moderate",
            },
          },
          {
            id: "day_3_dumbbell_row",
            exerciseId: "dumbbell_row",
            label: "Dumbbell Row",
            exerciseAlternatives: getExerciseById("dumbbell_row")?.alternatives,
            estimateFrom: "dumbbell_row",
            prescription: {
              sets: 3,
              reps: "8-10 each side",
              restSeconds: 90,
              intensity: "moderate",
            },
          },
          {
            id: "day_3_incline_dumbbell_curl",
            exerciseId: "incline_dumbbell_curl",
            label: "Incline Dumbbell Curl",
            exerciseAlternatives: getExerciseById("incline_dumbbell_curl")?.alternatives,
            estimateFrom: "bicep_curl",
            prescription: {
              sets: 3,
              reps: "10-15",
              restSeconds: 60,
              intensity: "moderate",
            },
            notes: "Use the estimated per-dumbbell weight.",
          },
          {
            id: "day_3_reverse_pec_deck",
            exerciseId: "reverse_pec_deck",
            label: "Reverse Pec Deck",
            exerciseAlternatives: getExerciseById("reverse_pec_deck")?.alternatives,
            prescription: {
              sets: 3,
              reps: "12-15",
              restSeconds: 60,
              intensity: "moderate",
            },
          },
        ],
      },
      {
        id: "day_4_lower_2",
        label: "Lower 2",
        focus: "Hinge, unilateral work, and quads",
        exercises: [
          {
            id: "day_4_deadlift",
            exerciseId: "deadlift",
            label: "Barbell Deadlift",
            exerciseAlternatives: getExerciseById("deadlift")?.alternatives,
            estimateFrom: "deadlift",
            prescription: {
              sets: 4,
              reps: "6-8",
              restSeconds: 150,
              intensity: "hard",
            },
          },
          {
            id: "day_4_bulgarian_split_squat",
            exerciseId: "bulgarian_split_squat",
            label: "Bulgarian Split Squat",
            exerciseAlternatives: getExerciseById("bulgarian_split_squat")?.alternatives,
            estimateFrom: "split_squat",
            prescription: {
              sets: 3,
              reps: "8-10 each side",
              restSeconds: 75,
              intensity: "moderate",
            },
            notes: "Use the estimated per-dumbbell weight.",
          },
          {
            id: "day_4_goblet_squat",
            exerciseId: "goblet_squat",
            label: "Goblet Squat",
            exerciseAlternatives: getExerciseById("goblet_squat")?.alternatives,
            estimateFrom: "goblet_squat",
            prescription: {
              sets: 3,
              reps: "10-12",
              restSeconds: 90,
              intensity: "moderate",
            },
            notes: "Use the estimated single-dumbbell weight.",
          },
          {
            id: "day_4_calf_raise",
            exerciseId: "seated_weighted_calf_raise",
            label: "Seated Calf Raise",
            exerciseAlternatives: getExerciseById("seated_weighted_calf_raise")?.alternatives,
            prescription: {
              sets: 4,
              reps: "12-15",
              restSeconds: 60,
              intensity: "moderate",
            },
          },
        ],
      },
    ],
  },
];
