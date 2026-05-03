import type { WeightUnit } from "../constants/weightEstimationRules";
import type {
  GeneratedWorkoutDayPreview,
  GeneratedWorkoutExercisePreview,
} from "../utils/generateWorkoutPreview";

export type WorkoutSessionStatus = "in_progress" | "completed" | "abandoned";

export type WorkoutBadgeId =
  | "pr"
  | "missed_reps"
  | "form_issue"
  | "pain"
  | "felt_easy"
  | "felt_hard"
  | "substituted";

export type WorkoutSetLog = {
  setNumber: number;
  targetReps?: string;
  actualReps?: number;
  weight?: number;
  weightUnit?: WeightUnit;
  completed: boolean;
  rpe?: number;
  rir?: number;
  notes?: string;
};

export type WorkoutExerciseLog = {
  slotId: string;
  plannedExerciseId: string;
  plannedLabel: string;
  exerciseId: string;
  label: string;
  wasSubstituted: boolean;
  prescriptionSnapshot: GeneratedWorkoutExercisePreview["prescription"] & {
    suggestedWeight?: number;
    weightUnit?: WeightUnit;
  };
  sets: WorkoutSetLog[];
  notes?: string;
  badgeIds: WorkoutBadgeId[];
  completed: boolean;
};

export type WorkoutDaySnapshot = Pick<
  GeneratedWorkoutDayPreview,
  "id" | "label" | "focus"
> & {
  exercises: GeneratedWorkoutExercisePreview[];
};

export type WorkoutSessionDto = {
  _id: string;
  clientId: string;
  workoutPlanId: string;
  programId: string;
  programDayId: string;
  programDayLabel: string;
  scheduledFor: string;
  startedAt: string;
  completedAt?: string | null;
  status: WorkoutSessionStatus;
  workoutSnapshot: WorkoutDaySnapshot;
  completionPercentage: number;
  completedExerciseCount: number;
  totalExerciseCount: number;
  notes?: string;
  badgeIds: WorkoutBadgeId[];
  durationSeconds?: number;
  exerciseLogs: WorkoutExerciseLog[];
  createdAt: string;
  updatedAt: string;
};
