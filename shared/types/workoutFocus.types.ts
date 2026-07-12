import type { MuscleGroup } from "../constants/exercise-library";
import type { GeneratedWorkoutPreview } from "../utils/generateWorkoutPreview";

export const WORKOUT_FOCUS_AREAS = [
  "chest",
  "upper_chest",
  "lower_chest",
  "lats",
  "upper_back",
  "rear_delts",
  "lateral_delts",
  "front_delts",
  "triceps",
  "biceps",
  "forearms",
  "quadriceps",
  "hamstrings",
  "glutes",
  "calves",
  "lower_back",
  "scapular_stabilizers",
] as const satisfies readonly MuscleGroup[];

export type WorkoutFocusArea = (typeof WORKOUT_FOCUS_AREAS)[number];

export type WorkoutFocusBlock = {
  focusArea: WorkoutFocusArea;
  durationWeeks: 2 | 4 | 6 | 8;
  startedAt: string;
  endsAt: string;
  reviewedPreview?: GeneratedWorkoutPreview;
};

export const WORKOUT_FOCUS_DURATION_WEEKS = [2, 4, 6, 8] as const;

export const WORKOUT_FOCUS_AREA_LABELS: Record<WorkoutFocusArea, string> = {
  chest: "Chest",
  upper_chest: "Upper chest",
  lower_chest: "Lower chest",
  lats: "Lats",
  upper_back: "Upper back",
  rear_delts: "Rear delts",
  lateral_delts: "Lateral delts",
  front_delts: "Front delts",
  triceps: "Triceps",
  biceps: "Biceps",
  forearms: "Forearms",
  quadriceps: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  calves: "Calves",
  lower_back: "Lower back",
  scapular_stabilizers: "Scapular stabilizers",
};
