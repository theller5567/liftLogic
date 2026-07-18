import { describe, expect, it } from "vitest";

import { exerciseLibrary } from "../../../shared/constants/exercise-library";
import type { OnboardingAvailableTrainingDays } from "../../../shared/types/onboarding.types";
import {
  buildExerciseReplacementPreview,
  generateWorkoutPreview,
} from "../../../shared/utils/generateWorkoutPreview";
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

  it("uses height and body weight as mild starting-weight conservatism for beginners", () => {
    const baseAnswers = {
      ageRange: "19_29",
      availableTrainingDays: 3,
      equipmentAccess: "full_gym",
      experienceLevel: "beginner",
      gender: "male",
      goal: "strength",
      recentTrainingConsistency: "brand_new",
      selectedWorkoutTemplateId: "starting_strength",
      weightUnit: "lb",
    } as const;
    const standardPreview = generateWorkoutPreview(baseAnswers);
    const guidedPreview = generateWorkoutPreview({
      ...baseAnswers,
      bodyWeight: 285,
      heightInches: 68,
    });
    const standardDeadlift = standardPreview.days[0].exercises.find(
      (exercise) => exercise.exerciseId === "deadlift"
    );
    const guidedDeadlift = guidedPreview.days[0].exercises.find(
      (exercise) => exercise.exerciseId === "deadlift"
    );

    expect(guidedDeadlift?.suggestedWeight).toBeLessThan(
      standardDeadlift?.suggestedWeight ?? 0
    );
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

  it("uses the broader library when an unavailable exercise has no curated alternatives", () => {
    const preview = generateWorkoutPreview({
      ageRange: "19_29",
      availableEquipment: ["dumbbells", "flat_bench", "bodyweight_space"],
      availableTrainingDays: 4,
      equipmentAccess: "dumbbells_only",
      experienceLevel: "intermediate",
      gender: "male",
      goal: "hypertrophy",
      selectedWorkoutTemplateId: "upper_lower_split",
      weightUnit: "lb",
    });
    const lowerDay = preview.days.find((day) =>
      day.exercises.some((exercise) => exercise.notes?.includes("Leg Press"))
    );
    const substitutedLegPress = lowerDay?.exercises.find((exercise) =>
      exercise.notes?.includes("Substituted for Leg Press because")
    );

    expect(substitutedLegPress).toBeDefined();
    expect(substitutedLegPress?.exerciseId).not.toBe("leg_press");
    expect(substitutedLegPress?.notes).not.toContain("Equipment warning");
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

  it("marks custom swaps and recalculates a materially different exercise safely", () => {
    const answers = {
      ageRange: "19_29",
      availableTrainingDays: 5,
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
    } as const;
    const preview = generateWorkoutPreview(answers);
    const frontSquat = preview.days[0].exercises[0];
    const replacement = buildExerciseReplacementPreview({
      answers,
      currentExercise: frontSquat,
      goal: preview.goal,
      nextExerciseId: "plank",
      swapSource: "custom",
    });

    expect(replacement.exerciseId).toBe("plank");
    expect(replacement.editMetadata).toEqual({
      swapSource: "custom",
      originalExerciseId: "front_squat",
      originalLabel: "Front Squat",
    });
    expect(replacement.prescription).not.toEqual(frontSquat.prescription);
    expect(replacement.suggestedWeight).toBeUndefined();
    expect(replacement.weightUnit).toBeUndefined();
    expect(replacement.notes).toContain(
      "Custom swap selected outside recommended alternatives"
    );
    expect(replacement.notes).toContain(
      "Prescription was updated for the selected exercise"
    );
    expect(replacement.notes).toContain(
      "Weight was reset because this exercise uses a different movement pattern"
    );
    expect(replacement.notes).toContain("Choose a comfortable starting load");
  });

  it("keeps compatible weight when swapping within the same estimator family", () => {
    const answers = {
      ageRange: "19_29",
      availableTrainingDays: 5,
      equipmentAccess: "full_gym",
      experienceLevel: "intermediate",
      gender: "male",
      goal: "hybrid",
      selectedWorkoutTemplateId: "strength_hypertrophy_5_day",
      weightUnit: "lb",
    } as const;
    const preview = generateWorkoutPreview(answers);
    const hipThrust = preview.days[0].exercises.find(
      (exercise) => exercise.exerciseId === "barbell_hip_thrust"
    );

    expect(hipThrust).toBeDefined();

    const replacement = buildExerciseReplacementPreview({
      answers,
      currentExercise: hipThrust!,
      goal: preview.goal,
      nextExerciseId: "smith_machine_hip_thrust",
      swapSource: "recommended",
    });

    expect(replacement.exerciseId).toBe("smith_machine_hip_thrust");
    expect(replacement.suggestedWeight).toBe(hipThrust!.suggestedWeight);
    expect(replacement.prescription).toEqual(hipThrust!.prescription);
    expect(replacement.editMetadata?.swapSource).toBe("recommended");
  });
});
