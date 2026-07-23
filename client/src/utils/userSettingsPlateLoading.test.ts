import { describe, expect, it } from "vitest";

import {
  createDefaultUserSettings,
  getBarbellWeight,
  getPlateInventory,
  getPlateLoadingUnit,
  mergeUserSettings,
} from "../../../shared/types/userSettings.types";

describe("plate loading user settings", () => {
  it("defaults to a 45 lb Olympic bar and common lb plates", () => {
    const settings = createDefaultUserSettings();

    expect(getPlateLoadingUnit(settings)).toBe("lb");
    expect(getBarbellWeight(settings)).toBe(45);
    expect(getPlateInventory(settings)).toEqual([
      { count: 8, size: 45 },
      { count: 2, size: 35 },
      { count: 2, size: 25 },
      { count: 2, size: 10 },
      { count: 4, size: 5 },
      { count: 2, size: 2.5 },
    ]);
  });

  it("defaults to kg plate loading when onboarding uses kg", () => {
    const settings = createDefaultUserSettings({
      availableEquipment: undefined,
      equipmentAccess: "full_gym",
      weightUnit: "kg",
    });

    expect(getPlateLoadingUnit(settings)).toBe("kg");
    expect(getBarbellWeight(settings)).toBe(20);
    expect(getPlateInventory(settings)[0]).toEqual({ count: 4, size: 25 });
  });

  it("resolves the women's Olympic bar preset", () => {
    const settings = mergeUserSettings({
      plateLoading: {
        ...createDefaultUserSettings().plateLoading,
        barbellPreset: "olympic_womens",
      },
    });

    expect(getBarbellWeight(settings)).toBe(33);

    const kgSettings = mergeUserSettings({
      plateLoading: {
        ...createDefaultUserSettings({ weightUnit: "kg" }).plateLoading,
        barbellPreset: "olympic_womens",
        unit: "kg",
      },
      weightUnit: "kg",
    });

    expect(getBarbellWeight(kgSettings)).toBe(15);
  });

  it("uses a positive custom barbell weight and falls back when custom is empty", () => {
    const customSettings = mergeUserSettings({
      plateLoading: {
        ...createDefaultUserSettings().plateLoading,
        barbellPreset: "custom",
        customBarbellWeight: 55,
      },
    });
    const emptyCustomSettings = mergeUserSettings({
      plateLoading: {
        ...createDefaultUserSettings().plateLoading,
        barbellPreset: "custom",
      },
    });

    expect(getBarbellWeight(customSettings)).toBe(55);
    expect(getBarbellWeight(emptyCustomSettings)).toBe(45);
  });

  it("merges older saved settings with plate-loading defaults", () => {
    const settings = mergeUserSettings({
      restTimer: {
        autoStartAfterSet: false,
      },
      weightUnit: "kg",
    });

    expect(settings.restTimer.autoStartAfterSet).toBe(false);
    expect(settings.plateLoading.unit).toBe("kg");
    expect(settings.plateLoading.plates.lb.length).toBeGreaterThan(0);
    expect(settings.plateLoading.plates.kg.length).toBeGreaterThan(0);
  });

  it("preserves saved plate inventory while filling the missing unit defaults", () => {
    const settings = mergeUserSettings({
      plateLoading: {
        barbellPreset: "olympic_mens",
        plates: {
          lb: [{ count: 6, size: 45 }],
        },
        unit: "lb",
      },
    });

    expect(settings.plateLoading.plates.lb).toEqual([{ count: 6, size: 45 }]);
    expect(settings.plateLoading.plates.kg.length).toBeGreaterThan(0);
  });
});
