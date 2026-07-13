import type { WorkoutFocusArea, WorkoutFocusBlock } from "./workoutFocus.types";

export type OnboardingAvailableTrainingDays = 1 | 2 | 3 | 4 | 5 | 6;
export type OnboardingGender = "male" | "female";
export type OnboardingAgeRange =
  | "7_15"
  | "16_18"
  | "19_29"
  | "30_39"
  | "40_49"
  | "50_plus";
export type OnboardingMode = "guided" | "browse";

export interface OnboardingAnswers {
  onboardingMode?: OnboardingMode;
  selectedWorkoutTemplateId?: string;
  goal?: "hypertrophy" | "strength" | "hybrid";
  goalPriority?: "hypertrophy" | "strength";
  experienceLevel?: "beginner" | "intermediate" | "advanced";
  equipmentAccess?: "full_gym" | "home_gym" | "dumbbells_only" | "basic_equipment";
  availableTrainingDays?: OnboardingAvailableTrainingDays;
  gender?: OnboardingGender;
  ageRange?: OnboardingAgeRange;
  focusArea?: WorkoutFocusArea;
  focusDurationWeeks?: WorkoutFocusBlock["durationWeeks"];
  weightUnit?: "lb" | "kg";
  bodyWeight?: number;

  benchPress?: {
    familiarity?: "never" | "some" | "often";
    knowsWorkingWeight?: boolean;
    estimatedWeight?: number;
    estimatedReps?: number;
    confidence?: "high" | "medium" | "low";
  };

  dumbbellRow?: {
    familiarity?: "never" | "some" | "often";
    knowsWorkingWeight?: boolean;
    estimatedWeight?: number;
    estimatedReps?: number;
    confidence?: "high" | "medium" | "low";
  };

  squat?: {
    familiarity?: "never" | "some" | "often";
    knowsWorkingWeight?: boolean;
    estimatedWeight?: number;
    estimatedReps?: number;
    confidence?: "high" | "medium" | "low";
  };

  barbellDeadlift?: {
    familiarity?: "never" | "some" | "often";
    knowsWorkingWeight?: boolean;
    estimatedWeight?: number;
    estimatedReps?: number;
    confidence?: "high" | "medium" | "low";
  };
}
