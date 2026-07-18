import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";

import type { OnboardingStep } from "../types";

type MultiSelectStepProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  step: OnboardingStep;
  fieldName: Path<TFieldValues>;
};

const MultiSelectStep = <TFieldValues extends FieldValues>({
  control,
  step,
  fieldName,
}: MultiSelectStepProps<TFieldValues>) => {
  if (step.type !== "multi_select" || !("options" in step)) {
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
                : "Please choose at least one option."
          : undefined,
      }}
      render={({ field }) => {
        const selectedValues: Array<string | number | boolean> = Array.isArray(
          field.value
        )
          ? field.value
          : [];

        return (
          <div className="grid gap-3">
            {step.options?.map((option) => {
              const selected = selectedValues.includes(option.value);
              const nextValues = selected
                ? selectedValues.filter((value) => value !== option.value)
                : [...selectedValues, option.value];

              return (
                <button
                  key={`${step.id}-${String(option.value)}`}
                  type="button"
                  onClick={() => {
                    field.onChange(nextValues);
                    field.onBlur();
                  }}
                  className={`onboarding-option border-control ${selected ? "is-selected" : ""}`}
                >
                  <span className="onboarding-option-label">
                    {option.label}
                  </span>
                  {"description" in option && option.description ? (
                    <span className="onboarding-option-description">
                      {option.description}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        );
      }}
    />
  );
};

export default MultiSelectStep;
