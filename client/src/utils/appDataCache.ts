import {
  getCurrentProfile,
  type UserProfileDto,
  type UserSettingsDto,
  type WorkoutPlanDto,
} from "../services/api";
import {
  writeSubmittedAnswers,
  writeUserSettings,
} from "./workoutStorage";

export type CurrentAppData = {
  profile: UserProfileDto;
  userSettings: UserSettingsDto;
  workoutPlan: WorkoutPlanDto | null;
};

type CachedAppData = CurrentAppData & {
  cachedAt: string;
};

const APP_DATA_CACHE_KEY = "liftlogic:app-data:current";
const canUseStorage = () => typeof window !== "undefined";

let inFlightCurrentAppData: Promise<CurrentAppData> | null = null;

const readStoredJson = <TValue>(storageKey: string): TValue | null => {
  if (!canUseStorage()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(storageKey);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as TValue;
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
};

const writeStoredJson = <TValue>(storageKey: string, value: TValue | null) => {
  if (!canUseStorage()) {
    return;
  }

  if (value === null) {
    window.localStorage.removeItem(storageKey);
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(value));
};

export const readCachedCurrentAppData = (): CachedAppData | null =>
  readStoredJson<CachedAppData>(APP_DATA_CACHE_KEY);

export const writeCachedCurrentAppData = (appData: CurrentAppData | null) => {
  writeStoredJson(
    APP_DATA_CACHE_KEY,
    appData ? { ...appData, cachedAt: new Date().toISOString() } : null
  );

  if (!appData) {
    return;
  }

  writeUserSettings(appData.userSettings);
  writeSubmittedAnswers(appData.workoutPlan?.onboardingAnswers ?? null);
};

export const updateCachedCurrentAppData = (
  patch: Partial<CurrentAppData>
): CachedAppData | null => {
  const current = readCachedCurrentAppData();

  if (!current) {
    return null;
  }

  const nextAppData = {
    profile: patch.profile ?? current.profile,
    userSettings: patch.userSettings ?? current.userSettings,
    workoutPlan:
      "workoutPlan" in patch ? patch.workoutPlan ?? null : current.workoutPlan,
  };

  writeCachedCurrentAppData(nextAppData);
  return readCachedCurrentAppData();
};

export const refreshCurrentAppData = () => {
  if (!inFlightCurrentAppData) {
    inFlightCurrentAppData = getCurrentProfile()
      .then((appData) => {
        writeCachedCurrentAppData(appData);
        return appData;
      })
      .finally(() => {
        inFlightCurrentAppData = null;
      });
  }

  return inFlightCurrentAppData;
};
