import { describe, expect, it } from "vitest";

import {
  equipmentPresetItems,
  type EquipmentItemId,
} from "../../../shared/constants/equipmentCatalog";
import { exerciseLibrary } from "../../../shared/constants/exercise-library";
import {
  canPerformExercise,
  getAvailableEquipmentFromAnswers,
  getExerciseEquipmentRequirement,
} from "../../../shared/utils/equipmentRequirements";

describe("equipmentRequirements", () => {
  it("expands existing equipment access presets", () => {
    expect(equipmentPresetItems.full_gym).toContain("barbell");
    expect(equipmentPresetItems.full_gym).toContain("leg_press");
    expect(equipmentPresetItems.home_gym).toContain("squat_rack");
    expect(equipmentPresetItems.dumbbells_only).toEqual(
      expect.arrayContaining(["dumbbells", "bodyweight_space"])
    );
    expect(equipmentPresetItems.basic_equipment).toContain("bands");
  });

  it("returns requirements for every exercise in the library", () => {
    const missingRequirements = exerciseLibrary.exercises.filter((exercise) => {
      const requirement = getExerciseEquipmentRequirement(exercise.id);
      return requirement.required.length === 0 && !requirement.oneOf?.length;
    });

    expect(missingRequirements).toEqual([]);
  });

  it("requires bench, barbell, and plates for barbell bench press", () => {
    expect(getExerciseEquipmentRequirement("barbell_bench_press")).toEqual({
      required: ["barbell", "weight_plates"],
      oneOf: [["flat_bench"], ["adjustable_bench"]],
    });
  });

  it("prefers exact equipment over preset equipment", () => {
    expect(
      getAvailableEquipmentFromAnswers({
        availableEquipment: ["dumbbells"],
        equipmentAccess: "full_gym",
      })
    ).toEqual(["dumbbells"]);
  });

  it("checks equipment compatibility", () => {
    const dumbbellsOnly: EquipmentItemId[] = [
      "dumbbells",
      "flat_bench",
      "bodyweight_space",
    ];

    expect(canPerformExercise("flat_dumbbell_press", dumbbellsOnly)).toBe(true);
    expect(canPerformExercise("back_squat", dumbbellsOnly)).toBe(false);
  });
});
