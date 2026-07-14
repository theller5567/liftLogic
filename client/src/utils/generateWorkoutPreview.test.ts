import { describe, expect, it } from "vitest";

import { exerciseLibrary } from "../../../shared/constants/exercise-library";
import type { OnboardingAvailableTrainingDays } from "../../../shared/types/onboarding.types";
import { generateWorkoutPreview } from "../../../shared/utils/generateWorkoutPreview";
import { getExerciseById } from "../../../shared/utils/exerciseLibraryAdapter";

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

  it("derives lower-body starting weights from onboarding anchors", () => {
    const preview = generateWorkoutPreview({
      ageRange: "19_29",
      availableTrainingDays: 5,
      barbellDeadlift: {
        confidence: "high",
        estimatedReps: 8,
        estimatedWeight: 300,
        familiarity: "often",
        knowsWorkingWeight: true,
      },
      equipmentAccess: "full_gym",
      experienceLevel: "intermediate",
      gender: "male",
      goal: "hybrid",
      selectedWorkoutTemplateId: "strength_hypertrophy_5_day",
      squat: {
        confidence: "high",
        estimatedReps: 8,
        estimatedWeight: 225,
        familiarity: "often",
        knowsWorkingWeight: true,
      },
      weightUnit: "lb",
    });

    const lowerBodyExercises = preview.days[0].exercises;

    expect(
      lowerBodyExercises.map((exercise) => [
        exercise.exerciseId,
        exercise.suggestedWeight,
      ])
    ).toEqual([
      ["front_squat", 140],
      ["deadlift", 250],
      ["barbell_hip_thrust", 200],
      ["single_leg_weighted_calf_raise", 30],
      ["leg_press_calf_raise", 170],
    ]);
  });

  it("generates suggested weights for weighted exercises in workout templates", () => {
    const missingWeights = exerciseLibrary.workoutTemplates.flatMap((template) => {
      const preview = generateWorkoutPreview({
        ageRange: "19_29",
        availableTrainingDays:
          template.daysRequired as OnboardingAvailableTrainingDays,
        barbellDeadlift: {
          confidence: "high",
          estimatedReps: 8,
          estimatedWeight: 300,
          familiarity: "often",
          knowsWorkingWeight: true,
        },
        benchPress: {
          confidence: "high",
          estimatedReps: 8,
          estimatedWeight: 185,
          familiarity: "often",
          knowsWorkingWeight: true,
        },
        dumbbellRow: {
          confidence: "high",
          estimatedReps: 8,
          estimatedWeight: 70,
          familiarity: "often",
          knowsWorkingWeight: true,
        },
        equipmentAccess: "full_gym",
        experienceLevel: template.experienceLevel,
        gender: "male",
        goal: "hybrid",
        selectedWorkoutTemplateId: template.id,
        squat: {
          confidence: "high",
          estimatedReps: 8,
          estimatedWeight: 225,
          familiarity: "often",
          knowsWorkingWeight: true,
        },
        weightUnit: "lb",
      });

      return preview.days.flatMap((day) =>
        day.exercises.flatMap((previewExercise) => {
          const exercise = getExerciseById(previewExercise.exerciseId);
          const isLoadedExercise =
            exercise &&
            exercise.equipmentType !== "bodyweight" &&
            exercise.equipmentType !== "other";

          return isLoadedExercise && previewExercise.suggestedWeight === undefined
            ? [`${template.id}:${previewExercise.exerciseId}`]
            : [];
        })
      );
    });

    expect(missingWeights).toEqual([]);
  });

  it("substitutes exercises when exact equipment is missing", () => {
    const preview = generateWorkoutPreview({
      ageRange: "19_29",
      availableEquipment: ["dumbbells", "flat_bench", "bodyweight_space"],
      availableTrainingDays: 3,
      equipmentAccess: "dumbbells_only",
      experienceLevel: "beginner",
      gender: "male",
      goal: "strength",
      selectedWorkoutTemplateId: "starting_strength",
      weightUnit: "lb",
    });

    const firstExercise = preview.days[0].exercises[0];

    expect(firstExercise.exerciseId).toBe("goblet_squat");
    expect(firstExercise.notes).toContain("Substituted for Back Squat");
    expect(firstExercise.notes).toContain("Keeps the same primary training target");
  });

  it("falls back to preset equipment for older onboarding answers", () => {
    const preview = generateWorkoutPreview({
      ageRange: "19_29",
      availableTrainingDays: 5,
      equipmentAccess: "full_gym",
      experienceLevel: "intermediate",
      gender: "male",
      goal: "hybrid",
      selectedWorkoutTemplateId: "strength_hypertrophy_5_day",
      weightUnit: "lb",
    });

    expect(preview.days[0].exercises[0].exerciseId).toBe("front_squat");
    expect(preview.days[0].exercises[0].notes ?? "").not.toContain(
      "Missing equipment"
    );
  });
});
