import { describe, expect, it } from "vitest";

import {
  estimateOneRepMax,
  getLoadFeasibility,
  getSingleSetCapacity,
  getVolumeAdjustedCapacity,
  parsePrescriptionTopReps,
} from "../../../shared/utils/loadFeasibility";

describe("loadFeasibility", () => {
  it("estimates one-rep max and single-set capacity with Epley", () => {
    expect(estimateOneRepMax(150, 5)).toBeCloseTo(175, 1);
    expect(getSingleSetCapacity(175, 12)).toBeCloseTo(125, 0);
  });

  it("calculates volume-adjusted capacity for multi-set prescriptions", () => {
    expect(
      getVolumeAdjustedCapacity({
        oneRepMax: 175,
        reps: 12,
        sets: 4,
      })
    ).toBeCloseTo(119.4, 1);
  });

  it("marks a load above 4x12 capacity as limit", () => {
    const result = getLoadFeasibility({
      assignedWeight: 125,
      capacity: { oneRepMax: 175, source: "onboarding" },
      equipmentType: "barbell",
      reps: "8-12",
      sets: 4,
      weightUnit: "lb",
    });

    expect(result.feasibleWeight).toBe(120);
    expect(result.status).toBe("limit");
  });

  it("marks a load beyond the tolerance window as too heavy", () => {
    const result = getLoadFeasibility({
      assignedWeight: 130,
      capacity: { oneRepMax: 175, source: "onboarding" },
      equipmentType: "barbell",
      reps: "8-12",
      sets: 4,
      weightUnit: "lb",
    });

    expect(result.status).toBe("too_heavy");
  });

  it("marks a matched feasible load as challenging", () => {
    const result = getLoadFeasibility({
      assignedWeight: 120,
      capacity: { oneRepMax: 175, source: "onboarding" },
      equipmentType: "barbell",
      reps: 12,
      sets: 4,
      weightUnit: "lb",
    });

    expect(result.status).toBe("challenging");
  });

  it("returns unknown when capacity is missing", () => {
    expect(
      getLoadFeasibility({
        assignedWeight: 120,
        equipmentType: "barbell",
        reps: "8-12",
        sets: 4,
        weightUnit: "lb",
      })
    ).toEqual(
      expect.objectContaining({
        source: "unknown",
        status: "unknown",
      })
    );
  });

  it("applies kg rounding", () => {
    const result = getLoadFeasibility({
      assignedWeight: 55,
      capacity: { oneRepMax: 80, source: "recent_performance" },
      equipmentType: "barbell",
      reps: 12,
      sets: 4,
      weightUnit: "kg",
    });

    expect(result.feasibleWeight).toBe(55);
  });

  it("applies new exercise and low confidence buffers", () => {
    const baseline = getLoadFeasibility({
      assignedWeight: 120,
      capacity: { oneRepMax: 175, source: "onboarding" },
      confidence: "high",
      equipmentType: "barbell",
      reps: 12,
      sets: 4,
      weightUnit: "lb",
    });
    const buffered = getLoadFeasibility({
      assignedWeight: 120,
      capacity: { oneRepMax: 175, source: "onboarding" },
      confidence: "low",
      equipmentType: "barbell",
      isNewExercise: true,
      reps: 12,
      sets: 4,
      weightUnit: "lb",
    });

    expect(baseline.feasibleWeight).toBe(120);
    expect(buffered.feasibleWeight).toBeLessThan(baseline.feasibleWeight ?? 0);
    expect(buffered.status).toBe("too_heavy");
  });

  it("parses the top rep target from prescription ranges", () => {
    expect(parsePrescriptionTopReps("8-12")).toBe(12);
    expect(parsePrescriptionTopReps("3 sets of 5")).toBe(5);
    expect(parsePrescriptionTopReps("time")).toBeNull();
  });
});
