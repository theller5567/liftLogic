import type { EquipmentItemId } from "../constants/equipmentCatalog";
import type { WeightUnit } from "../constants/weightEstimationRules";
import type { OnboardingAnswers } from "./onboarding.types";

export type WeightStepKey = "default" | "barbell" | "dumbbell" | "machine" | "cable";
export type PlateLoadingUnit = "lb" | "kg";
export type BarbellPreset = "olympic_mens" | "olympic_womens" | "custom";

export type PlateInventoryItem = {
  count: number;
  size: number;
};

export type PlateInventorySettings = {
  barbellPreset: BarbellPreset;
  customBarbellWeight?: number;
  plates: Record<PlateLoadingUnit, PlateInventoryItem[]>;
  unit: PlateLoadingUnit;
};

export type PlateInventorySettingsInput = Partial<
  Omit<PlateInventorySettings, "plates">
> & {
  plates?: Partial<Record<PlateLoadingUnit, PlateInventoryItem[]>>;
};

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
  nonCriticalSnoozedUntil?: string;
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
  plateLoading: PlateInventorySettings;
  theme: {
    primaryColor: string;
    secondaryColor: string;
  };
  messages: UserMessagePreferences;
  exerciseHistory: ExerciseHistoryPreferences;
};

export type UserSettingsInput = Partial<Omit<UserSettings, "plateLoading">> & {
  plateLoading?: PlateInventorySettingsInput;
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

export const BARBELL_PRESET_WEIGHTS: Record<
  Exclude<BarbellPreset, "custom">,
  Record<PlateLoadingUnit, number>
> = {
  olympic_mens: {
    kg: 20,
    lb: 45,
  },
  olympic_womens: {
    kg: 15,
    lb: 33,
  },
};

export const DEFAULT_PLATE_LOADING_SETTINGS: PlateInventorySettings = {
  barbellPreset: "olympic_mens",
  plates: {
    kg: [
      { count: 4, size: 25 },
      { count: 4, size: 20 },
      { count: 2, size: 15 },
      { count: 4, size: 10 },
      { count: 4, size: 5 },
      { count: 4, size: 2.5 },
      { count: 4, size: 1.25 },
    ],
    lb: [
      { count: 8, size: 45 },
      { count: 2, size: 35 },
      { count: 2, size: 25 },
      { count: 2, size: 10 },
      { count: 4, size: 5 },
      { count: 2, size: 2.5 },
    ],
  },
  unit: "lb",
};

const getDefaultStep = (weightUnit: WeightUnit) => (weightUnit === "kg" ? 2.5 : 5);

export const getPlateLoadingUnit = (
  settings: Pick<UserSettings, "plateLoading" | "weightUnit">
): PlateLoadingUnit =>
  settings.plateLoading.unit ?? (settings.weightUnit === "kg" ? "kg" : "lb");

export const getPlateInventory = (
  settings: Pick<UserSettings, "plateLoading" | "weightUnit">
) => {
  const unit = getPlateLoadingUnit(settings);

  return settings.plateLoading.plates[unit];
};

export const getBarbellWeight = (
  settings: Pick<UserSettings, "plateLoading" | "weightUnit">
) => {
  const unit = getPlateLoadingUnit(settings);
  const { barbellPreset, customBarbellWeight } = settings.plateLoading;

  if (barbellPreset === "custom") {
    return customBarbellWeight && customBarbellWeight > 0
      ? customBarbellWeight
      : BARBELL_PRESET_WEIGHTS.olympic_mens[unit];
  }

  return BARBELL_PRESET_WEIGHTS[barbellPreset][unit];
};

const mergePlateInventoryItems = (
  fallbackItems: PlateInventoryItem[],
  savedItems: PlateInventoryItem[] | undefined
) =>
  savedItems?.map((item) => ({ ...item })) ??
  fallbackItems.map((item) => ({ ...item }));

const mergePlateLoadingSettings = (
  settings: PlateInventorySettingsInput | undefined,
  weightUnit: WeightUnit
): PlateInventorySettings => {
  const defaultUnit = weightUnit === "kg" ? "kg" : "lb";
  const unit = settings?.unit ?? defaultUnit;

  return {
    ...DEFAULT_PLATE_LOADING_SETTINGS,
    ...settings,
    plates: {
      kg: mergePlateInventoryItems(
        DEFAULT_PLATE_LOADING_SETTINGS.plates.kg,
        settings?.plates?.kg
      ),
      lb: mergePlateInventoryItems(
        DEFAULT_PLATE_LOADING_SETTINGS.plates.lb,
        settings?.plates?.lb
      ),
    },
    unit,
  };
};

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
    plateLoading: mergePlateLoadingSettings(undefined, weightUnit),
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
  settings: UserSettingsInput | null | undefined,
  onboardingAnswers?: Pick<OnboardingAnswers, "weightUnit">
): UserSettings => {
  const defaults = createDefaultUserSettings(onboardingAnswers);
  const weightUnit = settings?.weightUnit ?? defaults.weightUnit;

  return {
    ...defaults,
    ...settings,
    weightUnit,
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
    plateLoading: mergePlateLoadingSettings(settings?.plateLoading, weightUnit),
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
