import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";

import type { OnboardingStep } from "../types";

type NumberStepProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  step: OnboardingStep;
  fieldName: Path<TFieldValues>;
};

const NumberStep = <TFieldValues extends FieldValues>({
  control,
  step,
  fieldName,
}: NumberStepProps<TFieldValues>) => {
  if (step.type !== "number") {
    return null;
  }

  return (
    <Controller
      control={control}
      name={fieldName}
      shouldUnregister={false}
      rules={{
        required: step.required ? "This field is required." : false,
        min:
          step.min !== undefined
            ? {
                value: step.min,
                message: `Value must be at least ${step.min}.`,
              }
            : undefined,
        max:
          step.max !== undefined
            ? {
                value: step.max,
                message: `Value must be ${step.max} or less.`,
              }
            : undefined,
      }}
      render={({ field }) => (
        <input
          type="number"
          min={step.min}
          max={step.max}
          value={typeof field.value === "number" ? field.value : ""}
          onBlur={field.onBlur}
          onChange={(event) => {
            const rawValue = event.target.value;
            field.onChange(rawValue === "" ? undefined : Number(rawValue));
          }}
          style={{
            width: "100%",
            padding: "0.9rem 1rem",
            borderRadius: "0.75rem",
            border: "1px solid hsl(var(--clr-neutral-600-b) / 0.5)",
            background: "hsl(var(--clr-neutral-900-b) / 0.5)",
            color: "inherit",
          }}
        />
      )}
    />
  );
};

export default NumberStep;
