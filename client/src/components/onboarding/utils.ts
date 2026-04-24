import type { OnboardingAnswers } from "../../../../shared/types/onboarding.types";

import type { OnboardingStep, ShowIfCondition } from "./types";

export const getValueByPath = (source: unknown, path: string) => {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key];
    }

    return undefined;
  }, source);
};

export const matchesCondition = (
  values: OnboardingAnswers,
  condition: ShowIfCondition | undefined
): boolean => {
  if (!condition) {
    return true;
  }

  if (condition.all) {
    return condition.all.every((entry) => matchesCondition(values, entry));
  }

  if (!condition.field) {
    return true;
  }

  const currentValue = getValueByPath(values, condition.field);

  if (condition.equals !== undefined) {
    return currentValue === condition.equals;
  }

  if (condition.in) {
    return condition.in.includes(currentValue);
  }

  return true;
};

export const isStepVisible = (values: OnboardingAnswers, step: OnboardingStep) => {
  return matchesCondition(values, step.showIf as ShowIfCondition | undefined);
};
