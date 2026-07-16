import {
  getCurrentProfile,
  getLiftLogicClientId,
  type UserProfileDto,
  type UserSettingsDto,
  type WorkoutPlanDto,
} from "../services/api";
import {
  clearStoredWorkoutState,
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

const APP_DATA_CACHE_KEY_PREFIX = "liftlogic:app-data:current";
export const APP_DATA_REFRESH_STALE_MS = 60_000;
const canUseStorage = () => typeof window !== "undefined";

let inFlightCurrentAppData: Promise<CurrentAppData> | null = null;
let currentCacheScope: string | null = null;

const getDefaultCacheScope = () => {
  if (!canUseStorage()) {
    return "server";
  }

  return `client:${getLiftLogicClientId()}`;
};

const getAppDataCacheKey = () =>
  `${APP_DATA_CACHE_KEY_PREFIX}:${currentCacheScope ?? getDefaultCacheScope()}`;

export const setCurrentAppDataCacheScope = (scope: string | null) => {
  currentCacheScope = scope ? `user:${scope}` : null;
  inFlightCurrentAppData = null;
};

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
  readStoredJson<CachedAppData>(getAppDataCacheKey());

export const writeCachedCurrentAppData = (appData: CurrentAppData | null) => {
  writeStoredJson(
    getAppDataCacheKey(),
    appData ? { ...appData, cachedAt: new Date().toISOString() } : null
  );

  if (!appData) {
    return;
  }

  writeUserSettings(appData.userSettings);
  writeSubmittedAnswers(appData.workoutPlan?.onboardingAnswers ?? null);
};

export const clearCachedCurrentAppData = (options?: {
  clearAllScopes?: boolean;
  clearWorkoutState?: boolean;
}) => {
  inFlightCurrentAppData = null;

  if (options?.clearAllScopes && canUseStorage()) {
    const storedKeys = Array.from(
      { length: window.localStorage.length },
      (_, index) => window.localStorage.key(index)
    );
    const scopedKeys = storedKeys.filter(
      (storageKey): storageKey is string =>
        typeof storageKey === "string" &&
        storageKey.startsWith(`${APP_DATA_CACHE_KEY_PREFIX}:`)
    );

    scopedKeys.forEach((storageKey) =>
      window.localStorage.removeItem(storageKey)
    );
  } else {
    writeCachedCurrentAppData(null);
  }

  if (options?.clearWorkoutState) {
    clearStoredWorkoutState();
  }
};

export const isCachedCurrentAppDataStale = (
  cachedAppData = readCachedCurrentAppData(),
  staleAfterMs = APP_DATA_REFRESH_STALE_MS
) => {
  if (!cachedAppData) {
    return true;
  }

  const cachedAt = new Date(cachedAppData.cachedAt).getTime();

  return !Number.isFinite(cachedAt) || Date.now() - cachedAt > staleAfterMs;
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
