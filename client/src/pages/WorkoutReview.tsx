import { useMemo, useState } from "react";
import clsx from "clsx";
import { Navigate, useNavigate } from "react-router-dom";

import BottomSheet from "../components/BottomSheet";
import Button from "../components/Button";
import WorkoutPreview from "../components/WorkoutPreview";
import {
  isApiEnabled,
  markWorkoutPlanReviewed,
  saveEditedWorkoutPreview,
} from "../services/api";
import { generateWorkoutPreview } from "../utils/generateWorkoutPreview";
import type { GeneratedWorkoutPreview } from "../utils/generateWorkoutPreview";
import { getEditedPreviewMessages } from "../utils/workoutPreviewEdits";
import {
  readEditedWorkoutPreview,
  readSubmittedAnswers,
  writeEditedWorkoutPreview,
  writeWorkoutReviewed,
} from "../utils/workoutStorage";
import { useUserFlow } from "../utils/userFlow";
import pageStyles from "../styles/pages/page.module.scss";

const WorkoutReview = () => {
  const navigate = useNavigate();
  const {
    destination,
    error,
    isLoading,
    workoutPlan: remoteWorkoutPlan,
  } = useUserFlow();
  const submittedAnswers =
    remoteWorkoutPlan?.onboardingAnswers ?? readSubmittedAnswers();
  const [localEditedPreview, setLocalEditedPreview] =
    useState<GeneratedWorkoutPreview | null>(() => readEditedWorkoutPreview());
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [showEditWarning, setShowEditWarning] = useState(false);

  const suggestedPreview = useMemo(
    () =>
      remoteWorkoutPlan?.suggestedPreview ??
      (submittedAnswers ? generateWorkoutPreview(submittedAnswers) : null),
    [remoteWorkoutPlan?.suggestedPreview, submittedAnswers]
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

  if (isLoading) {
    return <p className="text-muted">Loading workout review...</p>;
  }

  if (error) {
    return <p className="text-muted">We could not load your workout review yet. Please refresh.</p>;
  }

  if (destination && destination !== "/workout-review") {
    return <Navigate to={destination} replace />;
  }

  if (!submittedAnswers || !suggestedPreview || !preview) {
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

  const completeReview = async () => {
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
    navigate("/plan");
  };

  const handleContinue = () => {
    if (hasEdits) {
      setShowEditWarning(true);
      return;
    }

    completeReview();
  };

  return (
    <section className={clsx(pageStyles.shell, "grid gap-2")}>
      <header className={clsx(pageStyles.reviewHero, "grid gap-4")}>
        <div className="grid gap-3">
          <p className={clsx("text-secondary", pageStyles.eyebrow)}>
            Starter Program Preview
          </p>
          <h1 className={pageStyles.title}>{preview.label}</h1>
          <p className={pageStyles.meta}>
            {preview.daysPerWeek} days per week • Goal: {preview.goal} • Unit: {preview.weightUnit}
          </p>
          <p className="sub-text">A balanced 4-day program designed to build muscle through progressive overload and smart exercise selection.</p>
          
        </div>
        <div className="flex">
          <Button
            label={hasEdits ? "Continue with edits" : "Continue to Program"}
            tone="primary"
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
            onClick: completeReview,
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
    </section>
  );
};

export default WorkoutReview;
