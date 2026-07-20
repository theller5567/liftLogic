import type { OnboardingAnswers } from "./onboarding.types";
import type { WorkoutFocusBlock } from "./workoutFocus.types";
import type { GeneratedWorkoutPreview } from "../utils/generateWorkoutPreview";

export type ProgramHistoryStatus = "active" | "archived" | "deleted";

export type ProgramSwitchReason =
  | "onboarding"
  | "manual_switch"
  | "regenerated"
  | "reset";

export type WorkoutProgramHistoryEntry = {
  id: string;
  workoutPlanId: string;
  programId: string;
  programLabel: string;
  programVersion: number;
  startedAt: string;
  endedAt?: string | null;
  status: ProgramHistoryStatus;
  switchReason: ProgramSwitchReason;
};

export type WorkoutPlanDto = {
  _id: string;
  clientId: string;
  onboardingAnswers: OnboardingAnswers;
  suggestedPreview: GeneratedWorkoutPreview;
  editedPreview?: GeneratedWorkoutPreview | null;
  focusBlock?: WorkoutFocusBlock | null;
  workoutReviewed: boolean;
  activeProgramHistoryId?: string;
  programHistory?: WorkoutProgramHistoryEntry[];
  programVersion?: number;
  createdAt: string;
  updatedAt: string;
};
