import type { WorkoutPlanDto } from "../services/api";
import { applyWorkoutFocusBlock } from "../../../shared/utils/workoutFocus";
import type { WorkoutFocusBlock } from "../../../shared/types/workoutFocus.types";
import { generateWorkoutPreview } from "./generateWorkoutPreview";
import type { GeneratedWorkoutPreview } from "./generateWorkoutPreview";
import {
  readEditedWorkoutPreview,
  readWorkoutFocusBlock,
  readSubmittedAnswers,
} from "./workoutStorage";

export const resolveCurrentWorkoutFocusBlock = (
  workoutPlan: WorkoutPlanDto | null
): WorkoutFocusBlock | null =>
  workoutPlan?.focusBlock ?? readWorkoutFocusBlock();

export const resolveBaseWorkoutPreview = (
  workoutPlan: WorkoutPlanDto | null
): GeneratedWorkoutPreview | null => {
  if (workoutPlan) {
    return workoutPlan.editedPreview ?? workoutPlan.suggestedPreview;
  }

  const submittedAnswers = readSubmittedAnswers();

  if (!submittedAnswers) {
    return null;
  }

  const suggestedPreview = generateWorkoutPreview(submittedAnswers);
  const editedPreview = readEditedWorkoutPreview();

  const basePreview = editedPreview?.programId === suggestedPreview.programId
    ? editedPreview
    : suggestedPreview;

  return basePreview;
};

export const resolveCurrentWorkoutPreview = (
  workoutPlan: WorkoutPlanDto | null
): GeneratedWorkoutPreview | null => {
  const basePreview = resolveBaseWorkoutPreview(workoutPlan);

  if (!basePreview) {
    return null;
  }

  return applyWorkoutFocusBlock(
    basePreview,
    workoutPlan?.focusBlock ?? readWorkoutFocusBlock()
  );
};
