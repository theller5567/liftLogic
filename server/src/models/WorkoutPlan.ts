import { Schema, model } from "mongoose";

import type { OnboardingAnswers } from "../../../shared/types/onboarding.types";
import type { WorkoutFocusBlock } from "../../../shared/types/workoutFocus.types";
import type { GeneratedWorkoutPreview } from "../../../shared/utils/generateWorkoutPreview";

export type WorkoutPlanDocument = {
  clientId: string;
  onboardingAnswers: OnboardingAnswers;
  suggestedPreview: GeneratedWorkoutPreview;
  editedPreview?: GeneratedWorkoutPreview | null;
  focusBlock?: WorkoutFocusBlock | null;
  workoutReviewed: boolean;
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
  },
  { timestamps: true }
);

export const WorkoutPlan = model<WorkoutPlanDocument>(
  "WorkoutPlan",
  workoutPlanSchema
);
