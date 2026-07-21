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

  it("caps hypertrophy pressing weights from low-rep bench anchors", () => {
    const preview = generateWorkoutPreview({
      ageRange: "19_29",
      availableTrainingDays: 5,
      benchPress: {
        confidence: "high",
        estimatedReps: 6,
        estimatedWeight: 210,
        familiarity: "often",
        knowsWorkingWeight: true,
      },
      equipmentAccess: "full_gym",
      experienceLevel: "advanced",
      gender: "male",
      goal: "hypertrophy",
      selectedWorkoutTemplateId: "bro_split",
      weightUnit: "lb",
    });
    const chestDay = preview.days.find((day) => day.label === "Chest");

    expect(chestDay?.exercises.slice(0, 3).map((exercise) => [
      exercise.exerciseId,
      exercise.suggestedWeight,
    ])).toEqual([
      ["barbell_bench_press", 145],
      ["incline_dumbbell_press", 50],
      ["flat_dumbbell_press", 45],
    ]);
    expect(chestDay?.exercises[0].suggestedWeight).toBeLessThanOrEqual(150);
    expect(chestDay?.exercises[1].suggestedWeight).toBeLessThanOrEqual(50);
    expect(chestDay?.exercises[2].suggestedWeight).toBeLessThanOrEqual(50);
    expect(chestDay?.exercises[0].notes).toContain(
      "adjusted for 4 working sets"
    );
    expect(chestDay?.exercises[1].notes).toContain(
      "adjusted for 4 working sets"
    );
  });

  it("keeps strength prescriptions heavier than hypertrophy prescriptions from the same anchor", () => {
    const baseAnswers = {
      ageRange: "19_29",
      availableTrainingDays: 4,
      benchPress: {
        confidence: "high",
        estimatedReps: 6,
        estimatedWeight: 210,
        familiarity: "often",
        knowsWorkingWeight: true,
      },
      equipmentAccess: "full_gym",
      experienceLevel: "advanced",
      gender: "male",
      weightUnit: "lb",
    } as const;
    const hypertrophyPreview = generateWorkoutPreview({
      ...baseAnswers,
      goal: "hypertrophy",
      selectedWorkoutTemplateId: "upper_lower_split",
    });
    const strengthPreview = generateWorkoutPreview({
      ...baseAnswers,
      goal: "strength",
      selectedWorkoutTemplateId: "wendler_531",
    });
    const hypertrophyBench = hypertrophyPreview.days
      .flatMap((day) => day.exercises)
      .find((exercise) => exercise.exerciseId === "barbell_bench_press");
    const strengthBench = strengthPreview.days
      .flatMap((day) => day.exercises)
      .find((exercise) => exercise.exerciseId === "barbell_bench_press");

    expect(strengthBench?.suggestedWeight).toBeGreaterThan(
      hypertrophyBench?.suggestedWeight ?? 0
    );
  });

  it("lowers first-week weights as onboarding confidence decreases", () => {
    const buildPreview = (confidence: "high" | "medium" | "low") =>
      generateWorkoutPreview({
        ageRange: "19_29",
        availableTrainingDays: 5,
        benchPress: {
          confidence,
          estimatedReps: 6,
          estimatedWeight: 210,
          familiarity: "often",
          knowsWorkingWeight: true,
        },
        equipmentAccess: "full_gym",
        experienceLevel: "advanced",
        gender: "male",
        goal: "hypertrophy",
        selectedWorkoutTemplateId: "bro_split",
        weightUnit: "lb",
      });
    const highBench = buildPreview("high").days[0].exercises[0].suggestedWeight ?? 0;
    const mediumBench =
      buildPreview("medium").days[0].exercises[0].suggestedWeight ?? 0;
    const lowBench = buildPreview("low").days[0].exercises[0].suggestedWeight ?? 0;

    expect(mediumBench).toBeLessThan(highBench);
    expect(lowBench).toBeLessThan(mediumBench);
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

  it("avoids repeating the same exercise inside one workout day when an alternative exists", () => {
    const template = exerciseLibrary.workoutTemplates.find(
      (workoutTemplate) => workoutTemplate.id === "starting_strength"
    );
    const firstWorkoutDay = template?.workoutDays.find(
      (day) => day.type === "workout"
    );

    if (!firstWorkoutDay || firstWorkoutDay.type !== "workout") {
      throw new Error("Expected Starting Strength to include a workout day.");
    }

    const originalExerciseIds = [...firstWorkoutDay.exerciseIds];
    firstWorkoutDay.exerciseIds = ["back_squat", "back_squat"];

    try {
      const preview = generateWorkoutPreview({
        ageRange: "19_29",
        availableTrainingDays: 3,
        equipmentAccess: "full_gym",
        experienceLevel: "beginner",
        gender: "male",
        goal: "strength",
        selectedWorkoutTemplateId: "starting_strength",
        weightUnit: "lb",
      });
      const firstDayExerciseIds = preview.days[0].exercises.map(
        (exercise) => exercise.exerciseId
      );

      expect(new Set(firstDayExerciseIds).size).toBe(firstDayExerciseIds.length);
      expect(preview.days[0].exercises[1].exerciseId).not.toBe("back_squat");
      expect(preview.days[0].exercises[1].notes).toContain(
        "avoid repeating the same exercise"
      );
    } finally {
      firstWorkoutDay.exerciseIds = originalExerciseIds;
    }
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
