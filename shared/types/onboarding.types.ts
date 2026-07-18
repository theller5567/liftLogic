import type { EquipmentItemId } from "../constants/equipmentCatalog";
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
export type OnboardingSessionLength =
  | "20_30"
  | "30_45"
  | "45_60"
  | "60_90";
export type OnboardingRecentTrainingConsistency =
  | "brand_new"
  | "inconsistent"
  | "one_two_days"
  | "three_four_days"
  | "five_plus_days";
export type OnboardingBodyCompositionGoal =
  | "lose_fat"
  | "maintain_weight"
  | "gain_muscle"
  | "not_sure";
export type OnboardingMovementConfidence =
  | "need_guidance"
  | "comfortable_basics"
  | "very_confident";
export type OnboardingJointConcern =
  | "shoulders"
  | "elbows"
  | "wrists"
  | "lower_back"
  | "hips"
  | "knees"
  | "ankles";

export interface OnboardingAnswers {
  onboardingMode?: OnboardingMode;
  selectedWorkoutTemplateId?: string;
  goal?: "hypertrophy" | "strength" | "hybrid";
  goalPriority?: "hypertrophy" | "strength";
  bodyCompositionGoal?: OnboardingBodyCompositionGoal;
  experienceLevel?: "beginner" | "intermediate" | "advanced";
  recentTrainingConsistency?: OnboardingRecentTrainingConsistency;
  wantsRecommendationFineTuning?: boolean;
  movementConfidence?: OnboardingMovementConfidence;
  jointConcerns?: OnboardingJointConcern[];
  dislikedExerciseIds?: string[];
  equipmentAccess?: "full_gym" | "home_gym" | "dumbbells_only" | "basic_equipment";
  availableEquipment?: EquipmentItemId[];
  availableTrainingDays?: OnboardingAvailableTrainingDays;
  sessionLength?: OnboardingSessionLength;
  gender?: OnboardingGender;
  ageRange?: OnboardingAgeRange;
  focusArea?: WorkoutFocusArea;
  focusDurationWeeks?: WorkoutFocusBlock["durationWeeks"];
  weightUnit?: "lb" | "kg";
  heightInches?: number;
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
