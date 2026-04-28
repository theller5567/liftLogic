import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import OnboardingFlow from "../components/OnboardingFlow";
import { isApiEnabled, submitOnboardingAnswers } from "../services/api";
import type { OnboardingAnswers } from "../../../shared/types/onboarding.types";
import {
  clearDraftStepIndex,
  readDraftAnswers,
  readDraftStepIndex,
  readSubmittedAnswers,
  writeDraftAnswers,
  writeDraftStepIndex,
  writeEditedWorkoutPreview,
  writeSubmittedAnswers,
  writeWorkoutReviewed,
} from "../utils/workoutStorage";

const Onboarding = () => {
  const navigate = useNavigate();
  const [initialAnswers] = useState<OnboardingAnswers | undefined>(() =>
    readDraftAnswers() ?? readSubmittedAnswers() ?? undefined
  );
  const [initialStepIndex] = useState<number>(() =>
    readDraftStepIndex()
  );

  const handleAnswersChange = useCallback((answers: OnboardingAnswers) => {
    writeDraftAnswers(answers);
  }, []);

  const handleStepIndexChange = useCallback((stepIndex: number) => {
    writeDraftStepIndex(stepIndex);
  }, []);

  const handleComplete = async (answers: OnboardingAnswers) => {
    if (isApiEnabled()) {
      try {
        await submitOnboardingAnswers(answers);
      } catch (error) {
        console.error("Failed to save onboarding answers to API", error);
      }
    }

    writeSubmittedAnswers(answers);
    writeEditedWorkoutPreview(null);
    writeWorkoutReviewed(false);
    writeDraftAnswers(null);
    clearDraftStepIndex();
    navigate("/workout-review");
  };

  return (
    <OnboardingFlow
      initialAnswers={initialAnswers}
      initialStepIndex={initialStepIndex}
      onAnswersChange={handleAnswersChange}
      onStepIndexChange={handleStepIndexChange}
      onComplete={handleComplete}
    />
  );
};

export default Onboarding;
