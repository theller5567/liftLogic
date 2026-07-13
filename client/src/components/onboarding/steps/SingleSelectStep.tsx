import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";

import type { OnboardingStep } from "../types";

type SingleSelectStepProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  step: OnboardingStep;
  fieldName: Path<TFieldValues>;
};

const SingleSelectStep = <TFieldValues extends FieldValues>({
  control,
  step,
  fieldName,
}: SingleSelectStepProps<TFieldValues>) => {
  if (step.type !== "single_select" || !("options" in step)) {
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
              value !== undefined && value !== null && value !== ""
                ? true
                : "Please choose an option."
          : undefined,
      }}
      render={({ field }) => (
        <div className="grid gap-3">
          {step.options?.map((option) => {
            const selected = field.value === option.value;

            return (
              <button
                key={`${step.id}-${String(option.value)}`}
                type="button"
                onClick={() => {
                  field.onChange(option.value);
                  field.onBlur();
                }}
                className={`onboarding-option border-control ${selected ? "is-selected" : ""}`}
              >
                <span className="onboarding-option-label">{option.label}</span>
                {"description" in option && option.description ? (
                  <span className="onboarding-option-description">
                    {option.description}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    />
  );
};

export default SingleSelectStep;
