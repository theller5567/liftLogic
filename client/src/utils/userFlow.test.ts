import { describe, expect, it } from "vitest";

import type { WorkoutPlanDto } from "../services/api";
import { getUserFlowDestination } from "./userFlow";

const createWorkoutPlan = (
  overrides: Partial<WorkoutPlanDto> = {}
): WorkoutPlanDto =>
  ({
    _id: "plan-1",
    clientId: "user-1",
    onboardingAnswers: {},
    suggestedPreview: {
      days: [],
      daysPerWeek: 0,
      equipmentAccess: [],
      goal: "hypertrophy",
      label: "Test Program",
      level: [],
      programId: "program-1",
      weightUnit: "lb",
    },
    workoutReviewed: false,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    ...overrides,
  }) as WorkoutPlanDto;

describe("user flow destination", () => {
  it("sends first-run users without a workout plan to welcome", () => {
    expect(getUserFlowDestination(null)).toBe("/welcome");
  });

  it("sends users with an onboarding draft back to onboarding", () => {
    expect(
      getUserFlowDestination(null, { hasOnboardingDraft: true })
    ).toBe("/onboarding");
  });

  it("sends users with an unreviewed plan to workout review", () => {
    expect(getUserFlowDestination(createWorkoutPlan())).toBe("/workout-review");
  });

  it("sends users with a reviewed plan to dashboard", () => {
    expect(
      getUserFlowDestination(createWorkoutPlan({ workoutReviewed: true }))
    ).toBe("/dashboard");
  });
});
