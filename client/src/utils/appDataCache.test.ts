import { afterEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_MESSAGE_PREFERENCES } from "../../../shared/types/userSettings.types";
import type { CurrentAppData } from "./appDataCache";
import {
  clearCachedCurrentAppData,
  readCachedCurrentAppData,
  setCurrentAppDataCacheScope,
  updateCachedCurrentAppData,
  writeCachedCurrentAppData,
} from "./appDataCache";

const createStorage = () => {
  const values = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(values.keys())[index] ?? null),
    get length() {
      return values.size;
    },
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
  };
};

const createAppData = (): CurrentAppData =>
  ({
    profile: {
      _id: "profile-1",
      clientId: "client-1",
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
    },
    userSettings: {
      _id: "settings-1",
      clientId: "client-1",
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
      theme: {
        primaryColor: "#ffffff",
        secondaryColor: "#000000",
      },
      weightSteps: {
        barbell: 5,
        bodyweight: 1,
        cable: 5,
        default: 5,
        dumbbell: 5,
        machine: 5,
      },
      restTimer: {
        autoStartAfterSet: false,
        defaultSeconds: 90,
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
      weightUnit: "lb",
    },
    workoutPlan: null,
  }) as CurrentAppData;

describe("app data cache", () => {
  afterEach(() => {
    setCurrentAppDataCacheScope(null);
    vi.unstubAllGlobals();
  });

  it("stores and restores current app data", () => {
    const localStorage = createStorage();
    vi.stubGlobal("window", { localStorage });

    const appData = createAppData();
    writeCachedCurrentAppData(appData);

    expect(readCachedCurrentAppData()?.profile._id).toBe("profile-1");
    expect(readCachedCurrentAppData()?.userSettings._id).toBe("settings-1");
  });

  it("patches cached settings without clearing the cached profile", () => {
    const localStorage = createStorage();
    vi.stubGlobal("window", { localStorage });

    writeCachedCurrentAppData(createAppData());
    const patched = updateCachedCurrentAppData({
      userSettings: {
        ...createAppData().userSettings,
        _id: "settings-2",
      },
    });

    expect(patched?.profile._id).toBe("profile-1");
    expect(patched?.userSettings._id).toBe("settings-2");
  });

  it("keeps cached app data scoped by user", () => {
    const localStorage = createStorage();
    vi.stubGlobal("window", { localStorage });

    setCurrentAppDataCacheScope("user-1");
    writeCachedCurrentAppData(createAppData());

    setCurrentAppDataCacheScope("user-2");
    expect(readCachedCurrentAppData()).toBeNull();

    writeCachedCurrentAppData({
      ...createAppData(),
      profile: {
        ...createAppData().profile,
        _id: "profile-2",
      },
    });

    expect(readCachedCurrentAppData()?.profile._id).toBe("profile-2");

    setCurrentAppDataCacheScope("user-1");
    expect(readCachedCurrentAppData()?.profile._id).toBe("profile-1");
  });

  it("can clear cached app data across every scope", () => {
    const localStorage = createStorage();
    vi.stubGlobal("window", { localStorage });

    setCurrentAppDataCacheScope("user-1");
    writeCachedCurrentAppData(createAppData());
    setCurrentAppDataCacheScope("user-2");
    writeCachedCurrentAppData(createAppData());

    clearCachedCurrentAppData({ clearAllScopes: true });

    setCurrentAppDataCacheScope("user-1");
    expect(readCachedCurrentAppData()).toBeNull();
    setCurrentAppDataCacheScope("user-2");
    expect(readCachedCurrentAppData()).toBeNull();
  });
});
