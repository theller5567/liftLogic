import { useMemo, useState } from "react";
import clsx from "clsx";
import { Navigate, useNavigate } from "react-router-dom";
import CheckMark from "../assets/icons/078-check.svg?react";

import type {
  WorkoutFocusArea,
  WorkoutFocusBlock,
} from "../../../shared/types/workoutFocus.types";
import {
  WORKOUT_FOCUS_AREA_LABELS,
  WORKOUT_FOCUS_DURATION_WEEKS,
} from "../../../shared/types/workoutFocus.types";
import BottomSheet from "../components/BottomSheet";
import Button from "../components/Button";
import PageLoadingState from "../components/PageLoadingState";
import WorkoutTemplateBrowser from "../components/WorkoutTemplateBrowser";
import WorkoutPreview from "../components/WorkoutPreview";
import {
  isApiEnabled,
  markWorkoutPlanReviewed,
  saveEditedWorkoutPreview,
  submitOnboardingAnswers,
} from "../services/api";
import { generateWorkoutPreview } from "../utils/generateWorkoutPreview";
import type { GeneratedWorkoutPreview } from "../utils/generateWorkoutPreview";
import {
  getRankedWorkoutTemplateRecommendations,
  getWorkoutTemplateMatchReasons,
  getWorkoutTemplateWarnings,
} from "../../../shared/utils/workoutTemplateRecommendations";
import { getEditedPreviewMessages } from "../utils/workoutPreviewEdits";
import {
  readEditedWorkoutPreview,
  readSubmittedAnswers,
  writeEditedWorkoutPreview,
  writePendingWorkoutFocusBlock,
  writeSubmittedAnswers,
  writeWorkoutReviewed,
} from "../utils/workoutStorage";
import { useUserFlow } from "../utils/userFlow";
import pageStyles from "../styles/pages/page.module.scss";

const focusAreaOptions = Object.entries(WORKOUT_FOCUS_AREA_LABELS).map(
  ([value, label]) => ({
    label,
    value: value as WorkoutFocusArea,
  })
);

const WorkoutReview = () => {
  const navigate = useNavigate();
  const {
    destination,
    error,
    isLoading,
    refresh,
    workoutPlan: remoteWorkoutPlan,
  } = useUserFlow();
  const submittedAnswers =
    remoteWorkoutPlan?.onboardingAnswers ?? readSubmittedAnswers();
  const [localAnswers, setLocalAnswers] = useState<typeof submittedAnswers>(null);
  const [localEditedPreview, setLocalEditedPreview] =
    useState<GeneratedWorkoutPreview | null>(() => readEditedWorkoutPreview());
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [showEditWarning, setShowEditWarning] = useState(false);
  const [showFocusOffer, setShowFocusOffer] = useState(false);
  const [showPlanBrowser, setShowPlanBrowser] = useState(false);
  const [selectedFocusArea, setSelectedFocusArea] =
    useState<WorkoutFocusArea>("glutes");
  const [selectedFocusDuration, setSelectedFocusDuration] =
    useState<WorkoutFocusBlock["durationWeeks"]>(4);
  const activeAnswers = localAnswers ?? submittedAnswers;

  const suggestedPreview = useMemo(
    () =>
      localAnswers
        ? generateWorkoutPreview(localAnswers)
        : remoteWorkoutPlan?.suggestedPreview ??
          (submittedAnswers ? generateWorkoutPreview(submittedAnswers) : null),
    [localAnswers, remoteWorkoutPlan?.suggestedPreview, submittedAnswers]
  );
  const preview =
    suggestedPreview &&
    (isApiEnabled() ? remoteWorkoutPlan?.editedPreview : localEditedPreview)
      ?.programId === suggestedPreview.programId
      ? isApiEnabled()
        ? remoteWorkoutPlan?.editedPreview
        : localEditedPreview
      : suggestedPreview;
  const editedMessages =
    suggestedPreview && preview
      ? getEditedPreviewMessages(suggestedPreview, preview)
      : [];
  const hasEdits = editedMessages.length > 0;
  const recommendation = useMemo(
    () =>
      activeAnswers
        ? getRankedWorkoutTemplateRecommendations(activeAnswers).find(
            ({ template }) => template.id === preview?.programId
          )
        : undefined,
    [activeAnswers, preview?.programId]
  );
  const whyThisPlan = recommendation
    ? getWorkoutTemplateMatchReasons(recommendation.template, activeAnswers!)
    : [];
  const planWarnings = recommendation
    ? getWorkoutTemplateWarnings(recommendation.template, activeAnswers!)
    : [];

  if (isLoading) {
    return <PageLoadingState title="Loading workout review" />;
  }

  if (error) {
    return (
      <PageLoadingState
        tone="error"
        title="We could not load your workout review"
        message={error.message}
        onAction={refresh}
      />
    );
  }

  if (destination && destination !== "/workout-review") {
    return <Navigate to={destination} replace />;
  }

  if (!activeAnswers || !suggestedPreview || !preview) {
    return <Navigate to="/onboarding" replace />;
  }

  const handlePreviewChange = async (nextPreview: GeneratedWorkoutPreview) => {
    setReviewError(null);
    setLocalEditedPreview(nextPreview);
    writeEditedWorkoutPreview(nextPreview);
    writeWorkoutReviewed(false);

    if (isApiEnabled()) {
      try {
        await saveEditedWorkoutPreview(nextPreview);
      } catch (error) {
        console.error("Failed to save workout preview to API", error);
      }
    }
  };

  const handleTemplateSelect = async (templateId: string) => {
    if (!activeAnswers) {
      return;
    }

    const nextAnswers = {
      ...activeAnswers,
      onboardingMode: activeAnswers.onboardingMode ?? "browse",
      selectedWorkoutTemplateId: templateId,
    };

    setReviewError(null);
    setLocalAnswers(nextAnswers);
    setLocalEditedPreview(null);
    writeSubmittedAnswers(nextAnswers);
    writeEditedWorkoutPreview(null);
    writeWorkoutReviewed(false);

    if (isApiEnabled()) {
      try {
        await submitOnboardingAnswers(nextAnswers);
      } catch (error) {
        console.error("Failed to save selected workout template", error);
        setReviewError("Your plan choice is saved on this device, but we could not sync it yet.");
      }
    }

    setShowPlanBrowser(false);
  };

  const markReviewComplete = async () => {
    setReviewError(null);

    if (isApiEnabled()) {
      try {
        await markWorkoutPlanReviewed();
      } catch (error) {
        console.error("Failed to mark workout review complete in API", error);
        setReviewError("We could not save your workout review. Please try again.");
        return;
      }
    }

    writeWorkoutReviewed(true);
    return true;
  };

  const completeReview = async () => {
    const didComplete = await markReviewComplete();

    if (!didComplete) {
      return;
    }

    navigate("/plan");
  };

  const startSpecializationReview = async () => {
    const didComplete = await markReviewComplete();

    if (!didComplete) {
      return;
    }

    writePendingWorkoutFocusBlock({
      durationWeeks: selectedFocusDuration,
      focusArea: selectedFocusArea,
    });
    navigate("/focus-review");
  };

  const handleContinue = () => {
    if (hasEdits) {
      setShowEditWarning(true);
      return;
    }

    setShowFocusOffer(true);
  };

  return (
    <section className={clsx(pageStyles.shell, "grid gap-2")}>
      <header className={clsx(pageStyles.reviewHero, "grid gap-4")}>
        <div className="grid gap-3">
          <p className={clsx("text-secondary", pageStyles.eyebrow)}>Program Preview
          </p>
          <h1 className={pageStyles.title}>{preview.label}</h1>
          <p className={pageStyles.meta}>
            {preview.daysPerWeek} days per week • Goal: {preview.goal} • Unit: {preview.weightUnit}
          </p>
          <p className="sub-text">
            {recommendation?.template.description ??
              "Review your recommended plan before you start."}
          </p>
          {whyThisPlan.length > 0 ? (
            <div className={pageStyles.summaryList}>
              <p><strong>Why this plan?</strong></p>
              {whyThisPlan.map((reason) => (
                <p key={reason}><CheckMark className={clsx(pageStyles.checkmarkIcon)} />{reason}</p>
              ))}
              {planWarnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          ) : null}
          
        </div>
        <div className="flex">
          <Button
            label="View other plans"
            tone="white"
            variant="outline"
            icon="reminder"
            iconSize="medium"
            onClick={() => setShowPlanBrowser(true)}
          />
          <Button
            label={hasEdits ? "Continue with edits" : "Continue to Program"}
            tone="primary"
            icon="chevronRight"
            iconPosition="right"
            onClick={handleContinue}
          />
        </div>
        {reviewError ? <p className="text-muted">{reviewError}</p> : null}
      </header>

      <WorkoutPreview
        preview={preview}
        onPreviewChange={handlePreviewChange}
      />

      <BottomSheet
        open={showPlanBrowser}
        onClose={() => setShowPlanBrowser(false)}
        eyebrow="Plan Library"
        title="Compare workout plans"
        description="Choose a different plan any time. We will keep your profile answers and regenerate the preview."
        variant="full"
      >
        <WorkoutTemplateBrowser
          answers={activeAnswers}
          selectedTemplateId={preview.programId}
          onSelectTemplate={handleTemplateSelect}
        />
      </BottomSheet>

      <BottomSheet
        open={showEditWarning}
        onClose={() => setShowEditWarning(false)}
        eyebrow="Before You Continue"
        variant="full"
        title="Keep these edits?"
        description="Your changes have been saved, but the original recommendations are usually the best place to start."
        actions={[
          {
            label: "Continue with edits",
            tone: "primary",
            onClick: () => setShowFocusOffer(true),
          },
          {
            label: "Cancel",
            tone: "gray",
            variant: "outline",
          },
        ]}
      >
        <div className="grid gap-3">
          {editedMessages.map((message) => (
            <p key={message} className="text-muted">
              {message}
            </p>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet
        open={showFocusOffer}
        onClose={() => setShowFocusOffer(false)}
        eyebrow="Optional"
        title="Add a muscle focus block?"
        description="A focus block adds extra work for one muscle group for a short period while the rest of your program stays near maintenance."
        actions={[
          {
            label: "Skip for now",
            tone: "gray",
            variant: "outline",
            onClick: completeReview,
            closeOnClick: false,
          },
          {
            label: "Review focus block",
            tone: "primary",
            onClick: startSpecializationReview,
            closeOnClick: false,
          },
        ]}
      >
        <div className="grid gap-3">
          <label className="grid gap-2">
            <span className="sub-text">Focus muscle</span>
            <select
              value={selectedFocusArea}
              onChange={(event) =>
                setSelectedFocusArea(event.target.value as WorkoutFocusArea)
              }
            >
              {focusAreaOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="sub-text">Duration</span>
            <select
              value={selectedFocusDuration}
              onChange={(event) =>
                setSelectedFocusDuration(
                  Number(event.target.value) as WorkoutFocusBlock["durationWeeks"]
                )
              }
            >
              {WORKOUT_FOCUS_DURATION_WEEKS.map((duration) => (
                <option key={duration} value={duration}>
                  {duration} weeks
                </option>
              ))}
            </select>
          </label>
        </div>
      </BottomSheet>
    </section>
  );
};

export default WorkoutReview;
