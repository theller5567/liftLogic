import { describe, expect, it } from "vitest";

import { exerciseLibrary } from "../../../shared/constants/exercise-library";
import {
  createExerciseSlug,
  createExerciseSlugFromParts,
  formatExerciseMetadataLabel,
  getExerciseDisplayName,
  getExerciseIdFromSlug,
  getExerciseSearchText,
} from "./exerciseLibraryDisplay";

describe("exercise library display helpers", () => {
  it("formats metadata ids for display", () => {
    expect(formatExerciseMetadataLabel("horizontal_press")).toBe(
      "Horizontal Press"
    );
  });

  it("builds and parses exercise detail slugs using the stable exercise id", () => {
    const backSquat = exerciseLibrary.exercises.find(
      (exercise) => exercise.id === "back_squat"
    );

    expect(backSquat).toBeDefined();

    if (!backSquat) {
      return;
    }

    expect(createExerciseSlug(backSquat)).toBe("back-squat_back_squat");
    expect(getExerciseIdFromSlug("back-squat_back_squat")).toBe("back_squat");
  });

  it("falls back to label-based slug generation for unknown exercise ids", () => {
    expect(createExerciseSlugFromParts("custom_move", "Custom Move")).toBe(
      "custom-move_custom_move"
    );
  });

  it("uses display names and broad searchable metadata", () => {
    const exercise = exerciseLibrary.exercises[0];

    expect(getExerciseDisplayName(exercise)).toBe(
      exercise.displayName ?? exercise.name
    );
    expect(getExerciseSearchText(exercise)).toContain(exercise.id);
  });
});
