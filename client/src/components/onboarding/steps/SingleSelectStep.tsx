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
        <div style={{ display: "grid", gap: "0.75rem" }}>
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
                style={{
                  padding: "1rem",
                  textAlign: "left",
                  borderRadius: "0.75rem",
                  border: selected
                    ? "2px solid hsl(var(--clr-secondary-500-b))"
                    : "1px solid hsl(var(--clr-neutral-600-b) / 0.5)",
                  background: selected
                    ? "hsl(var(--clr-secondary-500-b) / 0.14)"
                    : "hsl(var(--clr-neutral-900-b) / 0.5)",
                  color: "inherit",
                  cursor: "pointer",
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    />
  );
};

export default SingleSelectStep;
