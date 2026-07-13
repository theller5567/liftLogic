import { describe, expect, it } from "vitest";

import type { WorkoutPlanDto } from "../services/api";
import { generateWorkoutPreview } from "./generateWorkoutPreview";
import type {
  GeneratedWorkoutExercisePreview,
  GeneratedWorkoutPreview,
} from "./generateWorkoutPreview";
import {
  applyWorkoutFocusBlock,
  createWorkoutFocusBlock,
  getIntroducedFocusExerciseIds,
} from "../../../shared/utils/workoutFocus";
import { getExerciseById } from "../../../shared/utils/exerciseLibraryAdapter";
import type { WorkoutFocusBlock } from "../../../shared/types/workoutFocus.types";
import { resolveCurrentWorkoutPreview } from "./workoutPlanPreview";

const now = new Date("2026-07-12T12:00:00.000Z");

const createPreview = () =>
  generateWorkoutPreview({
    equipmentAccess: "full_gym",
    experienceLevel: "beginner",
    goal: "hypertrophy",
    weightUnit: "lb",
  });

const createFourDayPreview = () =>
  generateWorkoutPreview({
    equipmentAccess: "full_gym",
    experienceLevel: "intermediate",
    goal: "hypertrophy",
    weightUnit: "lb",
  });

const countFocusExercises = (
  preview: GeneratedWorkoutPreview,
  focusArea: WorkoutFocusBlock["focusArea"]
) =>
  preview.days
    .flatMap((day) => day.exercises)
    .filter((exercise) => {
      const definition = getExerciseById(exercise.exerciseId);

      return (
        definition?.primaryMuscles.includes(focusArea) ||
        definition?.secondaryMuscles.includes(focusArea)
      );
    }).length;

const countFocusDays = (
  preview: GeneratedWorkoutPreview,
  focusArea: WorkoutFocusBlock["focusArea"]
) =>
  preview.days.filter((day) =>
    day.exercises.some((exercise) => {
      const definition = getExerciseById(exercise.exerciseId);

      return (
        definition?.primaryMuscles.includes(focusArea) ||
        definition?.secondaryMuscles.includes(focusArea)
      );
    })
  ).length;

const getExerciseCountByDay = (preview: GeneratedWorkoutPreview) =>
  preview.days.map((day) => day.exercises.length);

const getExerciseIds = (preview: GeneratedWorkoutPreview) =>
  preview.days.flatMap((day) =>
    day.exercises.map((exercise) => exercise.exerciseId)
  );

const createWorkoutPlan = (
  suggestedPreview: GeneratedWorkoutPreview,
  focusBlock?: WorkoutFocusBlock
): WorkoutPlanDto =>
  ({
    _id: "plan-1",
    clientId: "client-1",
    createdAt: now.toISOString(),
    editedPreview: null,
    focusBlock,
    onboardingAnswers: {},
    suggestedPreview,
    updatedAt: now.toISOString(),
    workoutReviewed: true,
  }) as WorkoutPlanDto;

describe("workout focus blocks", () => {
  it("prioritizes lateral delts on every day of a three-day specialization block", () => {
    const preview = createPreview();
    const originalPreview = structuredClone(preview);
    const focusBlock = createWorkoutFocusBlock({
      durationWeeks: 4,
      focusArea: "lateral_delts",
      now,
    });
    const focusedPreview = applyWorkoutFocusBlock(preview, focusBlock, now);

    expect(countFocusExercises(focusedPreview, "lateral_delts")).toBeGreaterThan(
      countFocusExercises(preview, "lateral_delts")
    );
    expect(countFocusDays(focusedPreview, "lateral_delts")).toBe(3);
    expect(getExerciseCountByDay(focusedPreview)).toEqual(
      getExerciseCountByDay(preview)
    );
    expect(new Set(getExerciseIds(focusedPreview)).size).toBe(
      getExerciseIds(focusedPreview).length
    );
    expect(preview).toEqual(originalPreview);
  });

  it("prioritizes glutes on at least three days of a four-day specialization block", () => {
    const preview = createFourDayPreview();
    const focusBlock = createWorkoutFocusBlock({
      durationWeeks: 4,
      focusArea: "glutes",
      now,
    });
    const focusedPreview = applyWorkoutFocusBlock(preview, focusBlock, now);

    expect(countFocusDays(focusedPreview, "glutes")).toBeGreaterThanOrEqual(3);
    expect(getExerciseCountByDay(focusedPreview)).toEqual(
      getExerciseCountByDay(preview)
    );
  });

  it("returns the base preview when the focus block is expired", () => {
    const preview = createPreview();
    const focusBlock = createWorkoutFocusBlock({
      durationWeeks: 2,
      focusArea: "glutes",
      now: new Date("2026-06-01T12:00:00.000Z"),
    });

    expect(applyWorkoutFocusBlock(preview, focusBlock, now)).toBe(preview);
  });

  it("handles missing exercise metadata without changing workout length", () => {
    const preview = createPreview();
    const unknownExercise: GeneratedWorkoutExercisePreview = {
      ...preview.days[0].exercises.at(-1)!,
      exerciseId: "unknown_exercise",
      exerciseAlternatives: [],
      label: "Unknown Exercise",
    };
    const previewWithMissingMetadata = {
      ...preview,
      days: [
        {
          ...preview.days[0],
          exercises: [...preview.days[0].exercises.slice(0, -1), unknownExercise],
        },
        ...preview.days.slice(1),
      ],
    };
    const focusBlock = createWorkoutFocusBlock({
      durationWeeks: 4,
      focusArea: "glutes",
      now,
    });

    const focusedPreview = applyWorkoutFocusBlock(
      previewWithMissingMetadata,
      focusBlock,
      now
    );

    expect(getExerciseCountByDay(focusedPreview)).toEqual(
      getExerciseCountByDay(previewWithMissingMetadata)
    );
  });

  it("resolves the focused preview from the current workout plan", () => {
    const preview = createPreview();
    const focusBlock = createWorkoutFocusBlock({
      durationWeeks: 4,
      focusArea: "glutes",
      now,
    });
    const focusedPreview = resolveCurrentWorkoutPreview(
      createWorkoutPlan(preview, focusBlock)
    );

    expect(focusedPreview).not.toBeNull();
    expect(countFocusDays(focusedPreview!, "glutes")).toBe(3);
  });

  it("uses a reviewed focus preview when one has been accepted", () => {
    const preview = createPreview();
    const focusBlock = createWorkoutFocusBlock({
      durationWeeks: 4,
      focusArea: "glutes",
      now,
      reviewedPreview: {
        ...preview,
        label: "Reviewed specialization",
      },
    });

    expect(applyWorkoutFocusBlock(preview, focusBlock, now).label).toBe(
      "Reviewed specialization"
    );
  });

  it("identifies exercises introduced by the specialization block", () => {
    const preview = createPreview();
    const focusBlock = createWorkoutFocusBlock({
      durationWeeks: 4,
      focusArea: "lateral_delts",
      now,
    });
    const focusedPreview = applyWorkoutFocusBlock(preview, focusBlock, now);

    expect(getIntroducedFocusExerciseIds(preview, focusedPreview).size).toBeGreaterThan(0);
  });
});
