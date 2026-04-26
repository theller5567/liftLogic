import type { OnboardingAnswers } from "../../../../../shared/types/onboarding.types";

type ReviewStepProps = {
  answers: OnboardingAnswers;
};

const ReviewStep = ({ answers }: ReviewStepProps) => {
  return (
    <div className="onboarding-review-card grid gap-3">
      <pre className="onboarding-review-json">
        {JSON.stringify(answers, null, 2)}
      </pre>
    </div>
  );
};

export default ReviewStep;
