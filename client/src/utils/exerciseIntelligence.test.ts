import { describe, expect, it } from "vitest";

import { generateWorkoutPreview } from "../../../shared/utils/generateWorkoutPreview";
import {
  getRankedWorkoutTemplateRecommendations,
  getTemplateExerciseProfile,
} from "../../../shared/utils/workoutTemplateRecommendations";
import { exerciseLibrary } from "../../../shared/constants/exercise-library";

describe("exercise intelligence recommendations", () => {
  it("adds exercise-level match reasons to workout recommendations", () => {
    const recommendations = getRankedWorkoutTemplateRecommendations({
      ageRange: "19_29",
      availableTrainingDays: 3,
      equipmentAccess: "full_gym",
      experienceLevel: "beginner",
      gender: "male",
      goal: "hypertrophy",
      weightUnit: "lb",
    });

    expect(recommendations[0].matchReasons).toEqual(
      expect.arrayContaining([
        "Strong equipment match",
        "Mostly beginner-friendly exercises",
      ])
    );
  });

  it("profiles template exercise makeup for goal-aware scoring", () => {
    const template = exerciseLibrary.workoutTemplates.find(
      (workoutTemplate) => workoutTemplate.id === "starting_strength"
    );

    expect(template).toBeDefined();

    const profile = getTemplateExerciseProfile(template!, {
      availableTrainingDays: 3,
      equipmentAccess: "full_gym",
      experienceLevel: "beginner",
      goal: "strength",
      weightUnit: "lb",
    });

    expect(profile.compoundRatio).toBeGreaterThan(0.8);
    expect(profile.goalFitAverage).toBeGreaterThan(0.8);
  });

  it("adds compact metadata tags to generated exercise previews", () => {
    const preview = generateWorkoutPreview({
      availableTrainingDays: 3,
      equipmentAccess: "full_gym",
      experienceLevel: "beginner",
      goal: "strength",
      selectedWorkoutTemplateId: "starting_strength",
      weightUnit: "lb",
    });

    expect(preview.days[0].exercises[0].detailTags).toEqual(
      expect.arrayContaining(["Intermediate", "Compound", "Barbell"])
    );
  });
});
