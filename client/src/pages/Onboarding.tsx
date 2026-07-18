import { useCallback, useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";

import LoadingSpinner from "../components/LoadingSpinner";
import OnboardingFlow from "../components/OnboardingFlow";
import PageLoadingState from "../components/PageLoadingState";
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
import { updateCachedCurrentAppData } from "../utils/appDataCache";

const Onboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRedoMode = searchParams.get("redo") === "1";
  const { destination, error, isLoading, refresh, refreshError, workoutPlan } =
    useUserFlow();
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const initialAnswers = useMemo<OnboardingAnswers | undefined>(
    () =>
      isRedoMode
        ? workoutPlan?.onboardingAnswers ??
          readSubmittedAnswers() ??
          readDraftAnswers() ??
          undefined
        : readDraftAnswers() ??
          (!isApiEnabled() ? readSubmittedAnswers() ?? undefined : undefined),
    [isRedoMode, workoutPlan]
  );
  const [initialStepIndex] = useState<number>(() =>
    isRedoMode ? 0 : readDraftAnswers() ? readDraftStepIndex() : 0
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
        const { profile, workoutPlan } = await submitOnboardingAnswers(answers);
        updateCachedCurrentAppData({ profile, workoutPlan });
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
    return (
      <PageLoadingState
        tone="error"
        title="We could not load onboarding"
        message={error.message}
        onAction={refresh}
      />
    );
  }

  if (!isRedoMode && destination && destination !== "/onboarding") {
    return <Navigate to={destination} replace />;
  }

  return (
    <>
      {refreshError ? (
        <p className="text-muted">
          Showing saved onboarding data while we reconnect: {refreshError.message}
        </p>
      ) : null}
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
