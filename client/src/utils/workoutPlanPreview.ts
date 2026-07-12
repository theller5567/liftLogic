import type { WorkoutPlanDto } from "../services/api";
import { generateWorkoutPreview } from "./generateWorkoutPreview";
import type { GeneratedWorkoutPreview } from "./generateWorkoutPreview";
import {
  readEditedWorkoutPreview,
  readSubmittedAnswers,
} from "./workoutStorage";

export const resolveCurrentWorkoutPreview = (
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

  return editedPreview?.programId === suggestedPreview.programId
    ? editedPreview
    : suggestedPreview;
};
