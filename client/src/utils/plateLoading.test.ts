import { describe, expect, it } from "vitest";

import { DEFAULT_PLATE_LOADING_SETTINGS } from "../../../shared/types/userSettings.types";
import { calculatePlateLoading } from "../../../shared/utils/plateLoading";

describe("plate loading calculator", () => {
  it("finds exact non-greedy plate combinations", () => {
    const result = calculatePlateLoading({
      barbellWeight: 45,
      inventory: [
        { count: 2, size: 25 },
        { count: 2, size: 10 },
        { count: 2, size: 2.5 },
      ],
      targetWeight: 120,
      unit: "lb",
    });

    expect(result.status).toBe("exact");
    expect(result.loadedTotalWeight).toBe(120);
    expect(result.platesPerSide).toEqual({
      "2.5": 1,
      "10": 1,
      "25": 1,
    });
  });

  it("ignores odd single plates for balanced barbell loading", () => {
    const result = calculatePlateLoading({
      barbellWeight: 45,
      inventory: [
        { count: 1, size: 45 },
        { count: 2, size: 25 },
      ],
      targetWeight: 185,
      unit: "lb",
    });

    expect(result.status).toBe("nearest");
    expect(result.loadedTotalWeight).toBe(95);
    expect(result.platesPerSide).toEqual({ "25": 1 });
    expect(result.shortfall).toBe(90);
  });

  it("returns closest under and over options when exact loading is unavailable", () => {
    const result = calculatePlateLoading({
      barbellWeight: 45,
      inventory: [
        { count: 2, size: 45 },
        { count: 2, size: 10 },
      ],
      targetWeight: 125,
      unit: "lb",
    });

    expect(result.status).toBe("nearest");
    expect(result.loadedTotalWeight).toBe(65);
    expect(result.closestUnder?.loadedTotalWeight).toBe(65);
    expect(result.closestOver?.loadedTotalWeight).toBe(135);
    expect(result.shortfall).toBe(60);
  });

  it("handles insufficient inventory with only the bar as closest under", () => {
    const result = calculatePlateLoading({
      barbellWeight: 45,
      inventory: [],
      targetWeight: 135,
      unit: "lb",
    });

    expect(result.status).toBe("nearest");
    expect(result.loadedTotalWeight).toBe(45);
    expect(result.platesPerSide).toEqual({});
    expect(result.shortfall).toBe(90);
    expect(result.closestOver).toBeUndefined();
  });

  it("supports the default lb plate inventory", () => {
    const result = calculatePlateLoading({
      barbellWeight: 45,
      inventory: DEFAULT_PLATE_LOADING_SETTINGS.plates.lb,
      targetWeight: 185,
      unit: "lb",
    });

    expect(result.status).toBe("exact");
    expect(result.loadedTotalWeight).toBe(185);
    expect(result.platesPerSide).toEqual({
      "25": 1,
      "45": 1,
    });
  });

  it("supports the default kg plate inventory", () => {
    const result = calculatePlateLoading({
      barbellWeight: 20,
      inventory: DEFAULT_PLATE_LOADING_SETTINGS.plates.kg,
      targetWeight: 100,
      unit: "kg",
    });

    expect(result.status).toBe("exact");
    expect(result.loadedTotalWeight).toBe(100);
    expect(result.platesPerSide).toEqual({
      "20": 2,
    });
  });

  it("marks target weights below the bar as invalid", () => {
    const result = calculatePlateLoading({
      barbellWeight: 45,
      inventory: DEFAULT_PLATE_LOADING_SETTINGS.plates.lb,
      targetWeight: 35,
      unit: "lb",
    });

    expect(result.status).toBe("invalid");
    expect(result.loadedTotalWeight).toBeNull();
  });
});
