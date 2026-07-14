import { Controller, type Control, type Path } from "react-hook-form";

import type { EquipmentItemId } from "../../../../../shared/constants/equipmentCatalog";
import type { OnboardingAnswers } from "../../../../../shared/types/onboarding.types";
import EquipmentInventoryPicker from "../../EquipmentInventoryPicker";
import type { OnboardingStep } from "../types";

type EquipmentInventoryStepProps = {
  control: Control<OnboardingAnswers>;
  fieldName: Path<OnboardingAnswers>;
  step: OnboardingStep;
};

const EquipmentInventoryStep = ({
  control,
  fieldName,
  step,
}: EquipmentInventoryStepProps) => {
  if (step.type !== "equipment_inventory") {
    return null;
  }

  return (
    <Controller
      control={control}
      name={fieldName}
      shouldUnregister={false}
      rules={{
        validate: step.required
          ? (value) =>
              Array.isArray(value) && value.length > 0
                ? true
                : "Please choose at least one item."
          : undefined,
      }}
      render={({ field }) => (
        <EquipmentInventoryPicker
          selectedEquipment={(field.value as EquipmentItemId[] | undefined) ?? []}
          onChange={(equipment) => {
            field.onChange(equipment);
            field.onBlur();
          }}
        />
      )}
    />
  );
};

export default EquipmentInventoryStep;
