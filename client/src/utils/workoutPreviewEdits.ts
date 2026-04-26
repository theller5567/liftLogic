import type { GeneratedWorkoutPreview } from "./generateWorkoutPreview";

const getExercisesBySlotId = (preview: GeneratedWorkoutPreview) =>
  new Map(
    preview.days.flatMap((day) =>
      day.exercises.map((exercise) => [exercise.id, exercise] as const)
    )
  );

export const getEditedPreviewMessages = (
  suggestedPreview: GeneratedWorkoutPreview,
  currentPreview: GeneratedWorkoutPreview
) => {
  const suggestedExercises = getExercisesBySlotId(suggestedPreview);
  let hasExerciseEdits = false;
  let hasWeightEdits = false;

  for (const day of currentPreview.days) {
    for (const exercise of day.exercises) {
      const suggestedExercise = suggestedExercises.get(exercise.id);

      if (!suggestedExercise) {
        continue;
      }

      if (exercise.exerciseId !== suggestedExercise.exerciseId) {
        hasExerciseEdits = true;
        continue;
      }

      if (exercise.suggestedWeight !== suggestedExercise.suggestedWeight) {
        hasWeightEdits = true;
      }
    }
  }

  const messages: string[] = [];

  if (hasExerciseEdits) {
    messages.push(
      "The suggested exercises were selected to match your goal, experience, and available equipment. It is recommended to stick with them unless you need a substitution."
    );
  }

  if (hasWeightEdits) {
    messages.push(
      "The suggested starting weights are designed to give you a manageable first week. It is recommended to keep them unless the loads feel clearly too light or too heavy."
    );
  }

  return messages;
};
