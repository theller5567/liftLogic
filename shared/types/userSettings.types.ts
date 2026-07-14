import type { EquipmentItemId } from "../constants/equipmentCatalog";
import type { WeightUnit } from "../constants/weightEstimationRules";
import type { OnboardingAnswers } from "./onboarding.types";

export type WeightStepKey = "default" | "barbell" | "dumbbell" | "machine" | "cable";

export type UserSettings = {
  weightUnit: WeightUnit;
  weightSteps: Record<WeightStepKey, number>;
  restTimer: {
    autoStartAfterSet: boolean;
    defaultSeconds?: number;
  };
  equipmentInventory?: EquipmentItemId[];
  theme: {
    primaryColor: string;
    secondaryColor: string;
  };
};

export const DEFAULT_THEME_SETTINGS = {
  primaryColor: "#c9f15a",
  secondaryColor: "#24a8fb",
} as const;

const getDefaultStep = (weightUnit: WeightUnit) => (weightUnit === "kg" ? 2.5 : 5);

export const createDefaultUserSettings = (
  onboardingAnswers?: Pick<
    OnboardingAnswers,
    "availableEquipment" | "equipmentAccess" | "weightUnit"
  >
): UserSettings => {
  const weightUnit = onboardingAnswers?.weightUnit ?? "lb";
  const defaultStep = getDefaultStep(weightUnit);

  return {
    weightUnit,
    weightSteps: {
      default: defaultStep,
      barbell: defaultStep,
      dumbbell: defaultStep,
      machine: defaultStep,
      cable: defaultStep,
    },
    restTimer: {
      autoStartAfterSet: true,
      defaultSeconds: undefined,
    },
    equipmentInventory: onboardingAnswers?.availableEquipment,
    theme: {
      ...DEFAULT_THEME_SETTINGS,
    },
  };
};

export const mergeUserSettings = (
  settings: Partial<UserSettings> | null | undefined,
  onboardingAnswers?: Pick<OnboardingAnswers, "weightUnit">
): UserSettings => {
  const defaults = createDefaultUserSettings(onboardingAnswers);

  return {
    ...defaults,
    ...settings,
    weightSteps: {
      ...defaults.weightSteps,
      ...settings?.weightSteps,
    },
    restTimer: {
      ...defaults.restTimer,
      ...settings?.restTimer,
    },
    equipmentInventory:
      settings?.equipmentInventory ?? defaults.equipmentInventory,
    theme: {
      ...defaults.theme,
      ...settings?.theme,
    },
  };
};
