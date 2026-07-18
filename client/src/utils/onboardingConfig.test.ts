import { describe, expect, it } from "vitest";

import { onboardingConfig } from "./onboardingConfig";
import { matchesCondition } from "../components/onboarding/utils";
import type { OnboardingAnswers } from "../../../shared/types/onboarding.types";

const getStep = (stepId: string) => {
  const step = onboardingConfig.steps.find(
    (onboardingStep) => onboardingStep.id === stepId
  );

  if (!step) {
    throw new Error(`Missing onboarding step: ${stepId}`);
  }

  return step;
};

describe("onboarding config", () => {
  it("keeps preference detail questions hidden until users opt in", () => {
    const skippedAnswers: OnboardingAnswers = {
      wantsRecommendationFineTuning: false,
    };
    const optedInAnswers: OnboardingAnswers = {
      wantsRecommendationFineTuning: true,
    };
    const preferenceStepIds = [
      "movement_confidence",
      "joint_concerns",
      "disliked_exercises",
    ];

    for (const stepId of preferenceStepIds) {
      const step = getStep(stepId);

      expect(matchesCondition(skippedAnswers, step.showIf)).toBe(false);
      expect(matchesCondition(optedInAnswers, step.showIf)).toBe(true);
    }
  });

  it("uses multi-select controls for optional concern and dislike fields", () => {
    expect(getStep("joint_concerns")).toEqual(
      expect.objectContaining({
        field: "jointConcerns",
        required: false,
        type: "multi_select",
      })
    );
    expect(getStep("disliked_exercises")).toEqual(
      expect.objectContaining({
        field: "dislikedExerciseIds",
        required: false,
        type: "multi_select",
      })
    );
  });
});
