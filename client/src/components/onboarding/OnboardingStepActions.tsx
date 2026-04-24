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
    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
      <Button type="button" onClick={onBack} disabled={!canGoBack} label="Back" tone="gray" />
      <Button type="button" onClick={onNext} label={isLastStep ? "Finish" : "Next"} tone="secondary" />
    </div>
  );
};

export default OnboardingStepActions;
