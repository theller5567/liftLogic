import type { Control, FieldErrors, Path } from "react-hook-form";

import type { OnboardingAnswers } from "../../../../shared/types/onboarding.types";

import NumberStep from "./steps/NumberStep";
import SingleSelectStep from "./steps/SingleSelectStep";
import MultiSelectStep from "./steps/MultiSelectStep";
import EquipmentInventoryStep from "./steps/EquipmentInventoryStep";
import WorkoutTemplateBrowserStep from "./steps/WorkoutTemplateBrowserStep";
import type { OnboardingStep } from "./types";
import { getValueByPath } from "./utils";

type OnboardingStepContentProps = {
  answers: OnboardingAnswers;
  control: Control<OnboardingAnswers>;
  errors: FieldErrors<OnboardingAnswers>;
  step: OnboardingStep;
};

const OnboardingStepContent = ({
  answers,
  control,
  errors,
  step,
}: OnboardingStepContentProps) => {
  const currentFieldError =
    "field" in step && step.field ? getValueByPath(errors, step.field) : undefined;

  return (
    <>
      {"field" in step && step.field ? (
        <>
          {step.type === "single_select" ? (
            <SingleSelectStep
              key={step.id}
              control={control}
              step={step}
              fieldName={step.field as Path<OnboardingAnswers>}
            />
          ) : null}

          {step.type === "number" ? (
            <NumberStep
              key={step.id}
              control={control}
              step={step}
              fieldName={step.field as Path<OnboardingAnswers>}
            />
          ) : null}

          {step.type === "multi_select" ? (
            <MultiSelectStep
              key={step.id}
              control={control}
              step={step}
              fieldName={step.field as Path<OnboardingAnswers>}
            />
          ) : null}

          {step.type === "workout_template_browser" ? (
            <WorkoutTemplateBrowserStep
              key={step.id}
              answers={answers}
              control={control}
              step={step}
              fieldName={step.field as Path<OnboardingAnswers>}
            />
          ) : null}

          {step.type === "equipment_inventory" ? (
            <EquipmentInventoryStep
              key={step.id}
              control={control}
              step={step}
              fieldName={step.field as Path<OnboardingAnswers>}
            />
          ) : null}

          {currentFieldError ? (
            <p className="onboarding-error">
              {(currentFieldError as { message?: string }).message ??
                "Please complete this step."}
            </p>
          ) : null}
        </>
      ) : null}
    </>
  );
};

export default OnboardingStepContent;
