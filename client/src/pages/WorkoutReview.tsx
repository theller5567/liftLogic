import { useMemo, useState } from "react";
import clsx from "clsx";
import { Navigate, useNavigate } from "react-router-dom";

import BottomSheet from "../components/BottomSheet";
import Button from "../components/Button";
import WorkoutPreview from "../components/WorkoutPreview";
import { generateWorkoutPreview } from "../utils/generateWorkoutPreview";
import type { GeneratedWorkoutPreview } from "../utils/generateWorkoutPreview";
import { getEditedPreviewMessages } from "../utils/workoutPreviewEdits";
import {
  readEditedWorkoutPreview,
  readSubmittedAnswers,
  writeEditedWorkoutPreview,
  writeWorkoutReviewed,
} from "../utils/workoutStorage";
import pageStyles from "../styles/pages/page.module.scss";

const WorkoutReview = () => {
  const navigate = useNavigate();
  const submittedAnswers = readSubmittedAnswers();
  const [editedPreview, setEditedPreview] =
    useState<GeneratedWorkoutPreview | null>(() => readEditedWorkoutPreview());
  const [showEditWarning, setShowEditWarning] = useState(false);

  const suggestedPreview = useMemo(
    () => (submittedAnswers ? generateWorkoutPreview(submittedAnswers) : null),
    [submittedAnswers]
  );
  const preview =
    suggestedPreview && editedPreview?.programId === suggestedPreview.programId
      ? editedPreview
      : suggestedPreview;
  const editedMessages =
    suggestedPreview && preview
      ? getEditedPreviewMessages(suggestedPreview, preview)
      : [];
  const hasEdits = editedMessages.length > 0;

  if (!submittedAnswers || !suggestedPreview || !preview) {
    return <Navigate to="/onboarding" replace />;
  }

  const handlePreviewChange = (nextPreview: GeneratedWorkoutPreview) => {
    setEditedPreview(nextPreview);
    writeEditedWorkoutPreview(nextPreview);
    writeWorkoutReviewed(false);
  };

  const completeReview = () => {
    writeWorkoutReviewed(true);
    navigate("/dashboard");
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
            label: "Cancel",
            tone: "gray",
            variant: "outline",
          },
          {
            label: "Continue with edits",
            tone: "primary",
            onClick: completeReview,
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
