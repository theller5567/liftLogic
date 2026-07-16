import { useEffect, useMemo, useState } from "react";

import {
  createDefaultUserSettings,
  DEFAULT_THEME_SETTINGS,
  mergeUserSettings,
  type UserSettings,
  type WeightStepKey,
} from "../../../shared/types/userSettings.types";
import { isApiEnabled, saveUserSettings } from "../services/api";
import {
  readCachedCurrentAppData,
  refreshCurrentAppData,
  updateCachedCurrentAppData,
} from "./appDataCache";
import {
  readSubmittedAnswers,
  readUserSettings,
  writeUserSettings,
} from "./workoutStorage";

const DEFAULT_PRIMARY_HSL = "74 84% 64%";
const DEFAULT_SECONDARY_HSL = "205 95% 56%";

const hexToHslParts = (hexColor: string) => {
  const normalized = hexColor.replace("#", "");
  const red = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const green = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;

  if (max === min) {
    return `0 0% ${Math.round(lightness * 100)}%`;
  }

  const delta = max - min;
  const saturation =
    lightness > 0.5
      ? delta / (2 - max - min)
      : delta / (max + min);
  let hue = 0;

  if (max === red) {
    hue = (green - blue) / delta + (green < blue ? 6 : 0);
  } else if (max === green) {
    hue = (blue - red) / delta + 2;
  } else {
    hue = (red - green) / delta + 4;
  }

  return `${Math.round(hue * 60)} ${Math.round(saturation * 100)}% ${Math.round(
    lightness * 100
  )}%`;
};

const applyColorToken = (
  root: HTMLElement,
  tokenName: "primary" | "secondary",
  hexColor: string,
  fallbackHsl: string
) => {
  const isValidHex = /^#[0-9a-fA-F]{6}$/.test(hexColor);
  const hslParts = isValidHex ? hexToHslParts(hexColor) : fallbackHsl;

  root.style.setProperty(`--clr-${tokenName}-500`, `hsl(${hslParts})`);
  root.style.setProperty(`--clr-${tokenName}-500-b`, hslParts);
};

export const applyUserTheme = (settings: Pick<UserSettings, "theme">) => {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  applyColorToken(
    root,
    "primary",
    settings.theme.primaryColor,
    DEFAULT_PRIMARY_HSL
  );
  applyColorToken(
    root,
    "secondary",
    settings.theme.secondaryColor,
    DEFAULT_SECONDARY_HSL
  );
};

export const resetUserTheme = () => {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.style.removeProperty("--clr-primary-500");
  root.style.removeProperty("--clr-primary-500-b");
  root.style.removeProperty("--clr-secondary-500");
  root.style.removeProperty("--clr-secondary-500-b");
};

export const getLocalUserSettings = () => {
  const cachedAppData = readCachedCurrentAppData();

  if (cachedAppData) {
    return mergeUserSettings(
      cachedAppData.userSettings,
      cachedAppData.workoutPlan?.onboardingAnswers
    );
  }

  const submittedAnswers = readSubmittedAnswers() ?? undefined;
  return mergeUserSettings(readUserSettings(), submittedAnswers);
};

export const getWeightStepForKey = (
  settings: UserSettings,
  stepKey: WeightStepKey
) => settings.weightSteps[stepKey] || settings.weightSteps.default;

type UserSettingsState = {
  error: Error | null;
  isLoading: boolean;
  settings: UserSettings;
  saveSettings: (settings: UserSettings) => Promise<UserSettings>;
};

export const useUserSettings = (): UserSettingsState => {
  const apiEnabled = isApiEnabled();
  const cachedAppData = apiEnabled ? readCachedCurrentAppData() : null;
  const [settings, setSettings] = useState<UserSettings>(() =>
    getLocalUserSettings()
  );
  const [isLoading, setIsLoading] = useState(apiEnabled && !cachedAppData);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    applyUserTheme(settings);
  }, [settings]);

  useEffect(() => {
    if (!apiEnabled) {
      return;
    }

    let isCurrent = true;

    refreshCurrentAppData()
      .then(({ userSettings, workoutPlan }) => {
        if (!isCurrent) {
          return;
        }

        const nextSettings = mergeUserSettings(
          userSettings,
          workoutPlan?.onboardingAnswers
        );
        setSettings(nextSettings);
        writeUserSettings(nextSettings);
        setError(null);
      })
      .catch((settingsError) => {
        if (!isCurrent) {
          return;
        }

        setError(
          settingsError instanceof Error
            ? settingsError
            : new Error("Failed to load settings.")
        );
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [apiEnabled]);

  const saveSettings = useMemo(
    () => async (nextSettings: UserSettings) => {
      const normalizedSettings = mergeUserSettings(nextSettings);

      if (apiEnabled) {
        const { userSettings } = await saveUserSettings(normalizedSettings);
        const savedSettings = mergeUserSettings(userSettings);
        setSettings(savedSettings);
        writeUserSettings(savedSettings);
        updateCachedCurrentAppData({ userSettings });
        return savedSettings;
      }

      setSettings(normalizedSettings);
      writeUserSettings(normalizedSettings);
      return normalizedSettings;
    },
    [apiEnabled]
  );

  return {
    error,
    isLoading,
    settings,
    saveSettings,
  };
};

export const getDefaultThemeSettings = () => ({
  ...DEFAULT_THEME_SETTINGS,
});

export const getDefaultSettingsForCurrentUser = () =>
  createDefaultUserSettings(readSubmittedAnswers() ?? undefined);
