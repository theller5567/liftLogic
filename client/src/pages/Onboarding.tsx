import { useCallback, useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";

import BottomSheet from "../components/BottomSheet";
import LoadingSpinner from "../components/LoadingSpinner";
import OnboardingFlow from "../components/OnboardingFlow";
import PageLoadingState from "../components/PageLoadingState";
import {
  isApiEnabled,
  type ProgramSwitchOptions,
  submitOnboardingAnswers,
} from "../services/api";
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
import { generateWorkoutPreview } from "../utils/generateWorkoutPreview";
import pageStyles from "../styles/pages/page.module.scss";

const Onboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRedoMode = searchParams.get("redo") === "1";
  const { destination, error, isLoading, refresh, refreshError, workoutPlan } =
    useUserFlow();
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [pendingSwitchAnswers, setPendingSwitchAnswers] =
    useState<OnboardingAnswers | null>(null);
  const [abandonInProgressSessions, setAbandonInProgressSessions] =
    useState(true);
  const [preserveExerciseHistory, setPreserveExerciseHistory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const submitAnswers = async (
    answers: OnboardingAnswers,
    switchOptions?: ProgramSwitchOptions
  ) => {
    setSubmissionError(null);
    setIsSubmitting(true);

    if (isApiEnabled()) {
      try {
        const { profile, workoutPlan } = await submitOnboardingAnswers(
          answers,
          switchOptions
        );
        updateCachedCurrentAppData({ profile, workoutPlan });
      } catch (error) {
        console.error("Failed to save onboarding answers to API", error);
        setSubmissionError("We could not save your onboarding answers. Please try again.");
        setIsSubmitting(false);
        return;
      }
    }

    writeSubmittedAnswers(answers);
    writeEditedWorkoutPreview(null);
    writeWorkoutReviewed(false);
    writeDraftAnswers(null);
    clearDraftStepIndex();
    setPendingSwitchAnswers(null);
    navigate("/workout-review");
  };

  const handleComplete = async (answers: OnboardingAnswers) => {
    const nextPreview = generateWorkoutPreview(answers);
    const currentProgramId =
      workoutPlan?.editedPreview?.programId ??
      workoutPlan?.suggestedPreview.programId;
    const isProgramSwitch =
      isRedoMode && Boolean(workoutPlan) && currentProgramId !== nextPreview.programId;

    if (isProgramSwitch) {
      setPendingSwitchAnswers(answers);
      return;
    }

    await submitAnswers(answers);
  };

  const pendingSwitchPreview = pendingSwitchAnswers
    ? generateWorkoutPreview(pendingSwitchAnswers)
    : null;

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
      <BottomSheet
        open={Boolean(pendingSwitchAnswers)}
        onClose={() => {
          if (!isSubmitting) {
            setPendingSwitchAnswers(null);
          }
        }}
        eyebrow="Program switch"
        title="Switch workout program?"
        description="Your completed workouts will stay saved. Weekly progress will restart for the new program."
        closeOnOverlayClick={!isSubmitting}
        actions={[
          {
            disabled: !pendingSwitchAnswers || isSubmitting,
            loading: isSubmitting,
            label: isSubmitting ? "Switching..." : "Switch program",
            tone: "primary",
            closeOnClick: false,
            onClick: () => {
              if (!pendingSwitchAnswers) {
                return;
              }

              void submitAnswers(pendingSwitchAnswers, {
                abandonInProgressSessions,
                preserveExerciseHistory,
              });
            },
          },
          {
            disabled: isSubmitting,
            label: "Keep current plan",
            tone: "gray",
            variant: "outline",
            onClick: () => setPendingSwitchAnswers(null),
          },
        ]}
      >
        <div className={pageStyles.switchConfirmation}>
          <p>
            Current plan:{" "}
            <strong>{workoutPlan?.suggestedPreview.label ?? "Current plan"}</strong>
          </p>
          {pendingSwitchPreview ? (
            <p>
              New plan: <strong>{pendingSwitchPreview.label}</strong>
            </p>
          ) : null}
          <label>
            <input
              checked={preserveExerciseHistory}
              type="checkbox"
              onChange={(event) =>
                setPreserveExerciseHistory(event.currentTarget.checked)
              }
            />
            <span>Keep exercise history for starting weights and progression</span>
          </label>
          <label>
            <input
              checked={abandonInProgressSessions}
              type="checkbox"
              onChange={(event) =>
                setAbandonInProgressSessions(event.currentTarget.checked)
              }
            />
            <span>Abandon in-progress workouts from the old program</span>
          </label>
        </div>
      </BottomSheet>
    </>
  );
};

export default Onboarding;
