import type { onboardingConfig } from "../../utils/onboardingConfig";

export type OnboardingStep = (typeof onboardingConfig.steps)[number];

export type ShowIfCondition = {
  field?: string;
  equals?: unknown;
  in?: unknown[];
  all?: ShowIfCondition[];
};
