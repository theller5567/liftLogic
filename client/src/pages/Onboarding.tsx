import { useCallback, useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";

import LoadingSpinner from "../components/LoadingSpinner";
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
import { useUserFlow } from "../utils/userFlow";

const Onboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRedoMode = searchParams.get("redo") === "1";
  const { destination, error, isLoading, workoutPlan } = useUserFlow();
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const initialAnswers = useMemo<OnboardingAnswers | undefined>(
    () =>
      isRedoMode
        ? workoutPlan?.onboardingAnswers ??
          readSubmittedAnswers() ??
          readDraftAnswers() ??
          undefined
        : !isApiEnabled()
          ? readDraftAnswers() ?? readSubmittedAnswers() ?? undefined
          : undefined,
    [isRedoMode, workoutPlan]
  );
  const [initialStepIndex] = useState<number>(() =>
    isRedoMode ? 0 : !isApiEnabled() ? readDraftStepIndex() : 0
  );

  const handleAnswersChange = useCallback((answers: OnboardingAnswers) => {
    writeDraftAnswers(answers);
  }, []);

  const handleStepIndexChange = useCallback((stepIndex: number) => {
    writeDraftStepIndex(stepIndex);
  }, []);

  const handleComplete = async (answers: OnboardingAnswers) => {
    setSubmissionError(null);

    if (isApiEnabled()) {
      try {
        await submitOnboardingAnswers(answers);
      } catch (error) {
        console.error("Failed to save onboarding answers to API", error);
        setSubmissionError("We could not save your onboarding answers. Please try again.");
        return;
      }
    }

    writeSubmittedAnswers(answers);
    writeEditedWorkoutPreview(null);
    writeWorkoutReviewed(false);
    writeDraftAnswers(null);
    clearDraftStepIndex();
    navigate("/workout-review");
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen label="Loading onboarding..." />;
  }

  if (error) {
    return <p className="text-muted">We could not load your onboarding status. Please refresh.</p>;
  }

  if (!isRedoMode && destination && destination !== "/onboarding") {
    return <Navigate to={destination} replace />;
  }

  return (
    <>
      {submissionError ? <p className="text-muted">{submissionError}</p> : null}
      <OnboardingFlow
        initialAnswers={initialAnswers}
        initialStepIndex={initialStepIndex}
        onAnswersChange={handleAnswersChange}
        onStepIndexChange={handleStepIndexChange}
        onComplete={handleComplete}
      />
    </>
  );
};

export default Onboarding;
