import { describe, expect, it } from "vitest";

import { exerciseLibrary } from "../../../shared/constants/exercise-library";
import {
  exerciseDescriptions,
  getExerciseDescription,
} from "../../../shared/constants/exercise-descriptions";

const requiredListFields = [
  "setup",
  "execution",
  "coachingCues",
  "commonMistakes",
] as const;

describe("exercise descriptions", () => {
  it("resolves a structured description for every exercise", () => {
    const missingDescriptions = exerciseLibrary.exercises
      .map((exercise) => ({
        exerciseId: exercise.id,
        description: getExerciseDescription(exercise.id),
      }))
      .filter(({ description }) => !description);

    expect(missingDescriptions).toEqual([]);
    expect(Object.keys(exerciseDescriptions)).toHaveLength(
      exerciseLibrary.exercises.length
    );
  });

  it("provides required user-facing sections for every exercise", () => {
    const invalidDescriptions = exerciseLibrary.exercises.flatMap((exercise) => {
      const description = getExerciseDescription(exercise.id);

      if (!description) {
        return [exercise.id];
      }

      const missingRequiredText =
        !description.overview || !description.primaryTarget;
      const missingRequiredLists = requiredListFields.some(
        (field) => description[field].length === 0
      );

      return missingRequiredText || missingRequiredLists ? [exercise.id] : [];
    });

    expect(invalidDescriptions).toEqual([]);
  });

  it("keeps the curated back squat description available outside the main library", () => {
    const backSquat = exerciseLibrary.exercises.find(
      (exercise) => exercise.id === "back_squat"
    );
    const description = getExerciseDescription("back_squat");

    expect(backSquat?.description).toBeUndefined();
    expect(description?.overview).toContain("barbell across the upper back");
    expect(description?.setup.length).toBeGreaterThan(3);
  });
});
