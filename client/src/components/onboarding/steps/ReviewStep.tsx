import type { OnboardingAnswers } from "../../../../../shared/types/onboarding.types";

type ReviewStepProps = {
  answers: OnboardingAnswers;
};

const ReviewStep = ({ answers }: ReviewStepProps) => {
  return (
    <div
      style={{
        display: "grid",
        gap: "0.75rem",
        padding: "1rem",
        borderRadius: "0.75rem",
        background: "hsl(var(--clr-neutral-900-b) / 0.5)",
      }}
    >
      <pre
        style={{
          margin: 0,
          whiteSpace: "pre-wrap",
          fontFamily: "monospace",
          fontSize: "0.9rem",
        }}
      >
        {JSON.stringify(answers, null, 2)}
      </pre>
    </div>
  );
};

export default ReviewStep;
