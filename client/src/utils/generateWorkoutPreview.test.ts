import { describe, expect, it } from "vitest";

import { generateWorkoutPreview } from "../../../shared/utils/generateWorkoutPreview";

describe("generateWorkoutPreview", () => {
  it("prefers an exact available day match before a higher experience match", () => {
    const preview = generateWorkoutPreview({
      availableTrainingDays: 3,
      ageRange: "19_29",
      equipmentAccess: "full_gym",
      experienceLevel: "intermediate",
      gender: "male",
      goal: "hypertrophy",
      weightUnit: "lb",
    });

    expect(preview.daysPerWeek).toBe(3);
    expect(preview.programId).toBe("push_pull_legs_3_day");
  });

  it("falls back to fewer days when no exact day match exists", () => {
    const preview = generateWorkoutPreview({
      availableTrainingDays: 6,
      ageRange: "40_49",
      equipmentAccess: "home_gym",
      experienceLevel: "intermediate",
      gender: "female",
      goal: "hypertrophy",
      weightUnit: "lb",
    });

    expect(preview.daysPerWeek).toBeLessThanOrEqual(6);
    expect(preview.programId).toBe("strength_hypertrophy_5_day");
  });

  it("keeps young lifters on conservative beginner plans", () => {
    const preview = generateWorkoutPreview({
      availableTrainingDays: 4,
      ageRange: "7_15",
      equipmentAccess: "full_gym",
      experienceLevel: "advanced",
      gender: "male",
      goal: "strength",
      weightUnit: "lb",
    });

    expect(preview.level).toContain("beginner");
    expect(preview.daysPerWeek).toBeLessThanOrEqual(3);
  });

  it("includes suggested rest days from the selected library template", () => {
    const preview = generateWorkoutPreview({
      availableTrainingDays: 5,
      ageRange: "30_39",
      equipmentAccess: "home_gym",
      experienceLevel: "intermediate",
      gender: "male",
      goal: "hybrid",
      weightUnit: "lb",
    });

    expect(preview.programId).toBe("strength_hypertrophy_5_day");
    expect(preview.weeklySchedule?.filter((day) => day.type === "rest")).toEqual([
      {
        day: 3,
        type: "rest",
        label: "Rest Day",
      },
      {
        day: 7,
        type: "rest",
        label: "Rest Day",
      },
    ]);
  });

  it("uses a manually selected workout template when one is provided", () => {
    const preview = generateWorkoutPreview({
      ageRange: "19_29",
      availableTrainingDays: 3,
      equipmentAccess: "full_gym",
      experienceLevel: "beginner",
      gender: "male",
      onboardingMode: "browse",
      selectedWorkoutTemplateId: "phul",
      weightUnit: "lb",
    });

    expect(preview.programId).toBe("phul");
    expect(preview.label).toBe("PHUL");
  });
});
