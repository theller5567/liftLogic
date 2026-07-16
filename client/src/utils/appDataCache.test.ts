import { afterEach, describe, expect, it, vi } from "vitest";

import type { CurrentAppData } from "./appDataCache";
import {
  readCachedCurrentAppData,
  updateCachedCurrentAppData,
  writeCachedCurrentAppData,
} from "./appDataCache";

const createStorage = () => {
  const values = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
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
      weightUnit: "lb",
    },
    workoutPlan: null,
  }) as CurrentAppData;

describe("app data cache", () => {
  afterEach(() => {
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
});
