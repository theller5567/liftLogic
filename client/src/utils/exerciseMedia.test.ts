import { describe, expect, it } from "vitest";

import {
  canShowExerciseMediaAction,
  createUnavailableExerciseMediaResponse,
  getExerciseInstructionFallback,
  getExerciseMediaMetadata,
  getWorkoutTemplateMediaCoverage,
} from "../../../shared/utils/exerciseMedia";

describe("exerciseMedia", () => {
  it("keeps media metadata optional for library exercises", () => {
    expect(getExerciseMediaMetadata("back_squat")).toBeUndefined();
  });

  it("uses exercise notes as local instruction fallback", () => {
    expect(getExerciseInstructionFallback("dumbbell_lunge")).toEqual([
      "Use paired dumbbells or a goblet hold depending on balance and equipment.",
    ]);
    expect(canShowExerciseMediaAction("dumbbell_lunge")).toBe(true);
  });

  it("creates unavailable responses with fallback instructions when available", () => {
    expect(
      createUnavailableExerciseMediaResponse("dumbbell_lunge", "not_mapped")
    ).toEqual({
      status: "unavailable",
      exerciseId: "dumbbell_lunge",
      reason: "not_mapped",
      instructions: [
        "Use paired dumbbells or a goblet hold depending on balance and equipment.",
      ],
    });
  });

  it("reports progressive workout-template media coverage", () => {
    const coverage = getWorkoutTemplateMediaCoverage();

    expect(coverage.totalTemplateExercises).toBeGreaterThan(0);
    expect(coverage.mappedExerciseIds).toEqual([]);
    expect(coverage.missingExerciseIds.length).toBeGreaterThan(0);
  });
});
