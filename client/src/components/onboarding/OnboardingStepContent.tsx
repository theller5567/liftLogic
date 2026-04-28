import type { Control, FieldErrors, Path } from "react-hook-form";

import type { OnboardingAnswers } from "../../../../shared/types/onboarding.types";

import NumberStep from "./steps/NumberStep";
import SingleSelectStep from "./steps/SingleSelectStep";
import type { OnboardingStep } from "./types";
import { getValueByPath } from "./utils";

type OnboardingStepContentProps = {
  control: Control<OnboardingAnswers>;
  errors: FieldErrors<OnboardingAnswers>;
  step: OnboardingStep;
};

const OnboardingStepContent = ({
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
