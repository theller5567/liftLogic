import { Schema, model } from "mongoose";

import type { OnboardingAnswers } from "../../../shared/types/onboarding.types";
import type { WorkoutFocusBlock } from "../../../shared/types/workoutFocus.types";
import type { WorkoutProgramHistoryEntry } from "../../../shared/types/workoutPlan.types";
import type { GeneratedWorkoutPreview } from "../../../shared/utils/generateWorkoutPreview";

export type WorkoutPlanDocument = {
  clientId: string;
  initialOnboardingAnswers?: OnboardingAnswers;
  onboardingAnswers: OnboardingAnswers;
  suggestedPreview: GeneratedWorkoutPreview;
  editedPreview?: GeneratedWorkoutPreview | null;
  focusBlock?: WorkoutFocusBlock | null;
  workoutReviewed: boolean;
  activeProgramHistoryId?: string;
  programHistory?: WorkoutProgramHistoryEntry[];
  programVersion?: number;
  createdAt: Date;
  updatedAt: Date;
};

const workoutPlanSchema = new Schema<WorkoutPlanDocument>(
  {
    clientId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    onboardingAnswers: {
      type: Schema.Types.Mixed,
      required: true,
    },
    initialOnboardingAnswers: {
      type: Schema.Types.Mixed,
    },
    suggestedPreview: {
      type: Schema.Types.Mixed,
      required: true,
    },
    editedPreview: {
      type: Schema.Types.Mixed,
      default: null,
    },
    focusBlock: {
      type: Schema.Types.Mixed,
      default: null,
    },
    workoutReviewed: {
      type: Boolean,
      default: false,
    },
    activeProgramHistoryId: {
      type: String,
      trim: true,
    },
    programHistory: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    programVersion: {
      type: Number,
      default: 1,
      min: 1,
      index: true,
    },
  },
  { timestamps: true }
);

export const WorkoutPlan = model<WorkoutPlanDocument>(
  "WorkoutPlan",
  workoutPlanSchema
);
