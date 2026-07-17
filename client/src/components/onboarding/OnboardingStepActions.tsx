import Button from "../Button";

type OnboardingStepActionsProps = {
  canGoBack: boolean;
  isLastStep: boolean;
  onBack: () => void;
  onNext: () => void;
};

const OnboardingStepActions = ({
  canGoBack,
  isLastStep,
  onBack,
  onNext,
}: OnboardingStepActionsProps) => {
  return (
    <div className="flex justify-between gap-4">
      <Button type="button" onClick={onBack} disabled={!canGoBack} label="Back" tone="gray" />
      <Button type="button" onClick={onNext} label={isLastStep ? "Finish" : "Next"} tone="primary" />
    </div>
  );
};

export default OnboardingStepActions;
