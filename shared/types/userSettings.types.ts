import type { EquipmentItemId } from "../constants/equipmentCatalog";
import type { WeightUnit } from "../constants/weightEstimationRules";
import type { OnboardingAnswers } from "./onboarding.types";

export type WeightStepKey = "default" | "barbell" | "dumbbell" | "machine" | "cable";

export type UserMessageCategory =
  | "completion"
  | "progressive_overload"
  | "personal_record"
  | "consistency"
  | "recovery"
  | "education";

export type UserMessageSurface =
  | "dashboard"
  | "workout_summary"
  | "workout_exercise"
  | "trends";

export type UserMessageFrequency = "standard" | "fewer" | "important_only";

export type UserMessagePreferences = {
  categories: Record<UserMessageCategory, boolean>;
  frequency: UserMessageFrequency;
  surfaces: Record<UserMessageSurface, boolean>;
  futureReminders: boolean;
};

export type ExerciseHistoryPreferences = {
  includePreviousPrograms: boolean;
  resetCutoffs: Record<string, string>;
};

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
  messages: UserMessagePreferences;
  exerciseHistory: ExerciseHistoryPreferences;
};

export const DEFAULT_THEME_SETTINGS = {
  primaryColor: "#c9f15a",
  secondaryColor: "#24a8fb",
} as const;

export const DEFAULT_MESSAGE_PREFERENCES: UserMessagePreferences = {
  categories: {
    completion: true,
    progressive_overload: true,
    personal_record: true,
    consistency: true,
    recovery: true,
    education: true,
  },
  frequency: "standard",
  surfaces: {
    dashboard: true,
    workout_summary: true,
    workout_exercise: true,
    trends: true,
  },
  futureReminders: false,
};

export const DEFAULT_EXERCISE_HISTORY_PREFERENCES: ExerciseHistoryPreferences = {
  includePreviousPrograms: true,
  resetCutoffs: {},
};

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
    messages: {
      ...DEFAULT_MESSAGE_PREFERENCES,
      categories: {
        ...DEFAULT_MESSAGE_PREFERENCES.categories,
      },
      surfaces: {
        ...DEFAULT_MESSAGE_PREFERENCES.surfaces,
      },
    },
    exerciseHistory: {
      ...DEFAULT_EXERCISE_HISTORY_PREFERENCES,
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
    messages: {
      ...defaults.messages,
      ...settings?.messages,
      categories: {
        ...defaults.messages.categories,
        ...settings?.messages?.categories,
      },
      surfaces: {
        ...defaults.messages.surfaces,
        ...settings?.messages?.surfaces,
      },
    },
    exerciseHistory: {
      ...defaults.exerciseHistory,
      ...settings?.exerciseHistory,
      resetCutoffs: {
        ...defaults.exerciseHistory.resetCutoffs,
        ...settings?.exerciseHistory?.resetCutoffs,
      },
    },
  };
};
