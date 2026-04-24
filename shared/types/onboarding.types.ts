export interface OnboardingAnswers {
  goal?: "hypertrophy" | "strength" | "hybrid";
  goalPriority?: "hypertrophy" | "strength";
  experienceLevel?: "beginner" | "intermediate" | "advanced";
  equipmentAccess?: "full_gym" | "home_gym" | "dumbbells_only" | "basic_equipment";
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
