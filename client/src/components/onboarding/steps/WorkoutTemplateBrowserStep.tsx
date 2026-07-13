import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";

import type { OnboardingAnswers } from "../../../../../shared/types/onboarding.types";
import WorkoutTemplateBrowser from "../../WorkoutTemplateBrowser";
import type { OnboardingStep } from "../types";

type WorkoutTemplateBrowserStepProps<TFieldValues extends FieldValues> = {
  answers: OnboardingAnswers;
  control: Control<TFieldValues>;
  fieldName: Path<TFieldValues>;
  step: OnboardingStep;
};

const WorkoutTemplateBrowserStep = <TFieldValues extends FieldValues>({
  answers,
  control,
  fieldName,
  step,
}: WorkoutTemplateBrowserStepProps<TFieldValues>) => {
  if (step.type !== "workout_template_browser") {
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
                : "Please choose a workout plan."
          : undefined,
      }}
      render={({ field }) => (
        <WorkoutTemplateBrowser
          answers={answers}
          selectedTemplateId={typeof field.value === "string" ? field.value : undefined}
          onSelectTemplate={(templateId) => {
            field.onChange(templateId);
            field.onBlur();
          }}
        />
      )}
    />
  );
};

export default WorkoutTemplateBrowserStep;
