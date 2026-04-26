import { useMemo, useState } from "react";
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
    <section
      style={{
        width: "min(100%, 64rem)",
        display: "grid",
        gap: "1.5rem",
      }}
    >
      <header
        style={{
          display: "grid",
          gap: "1rem",
          padding: "1.5rem",
          borderRadius: "1rem",
          background: "hsl(var(--clr-secondary-1100))",
          border: "1px solid hsl(var(--clr-neutral-600-b) / 0.35)",
        }}
      >
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <p
            style={{
              margin: 0,
              color: "hsl(var(--clr-neutral-100-b))",
              fontSize: "0.85rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Starter Program Preview
          </p>
          <h1 style={{ margin: 0 }}>{preview.label}</h1>
          <p style={{ margin: 0, color: "hsl(var(--clr-neutral-100-b))" }}>
            {preview.daysPerWeek} days per week • Goal: {preview.goal} • Unit: {preview.weightUnit}
          </p>
        </div>
        <div style={{ display: "flex" }}>
          <Button
            label={hasEdits ? "Continue with edits" : "Continue"}
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
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {editedMessages.map((message) => (
            <p
              key={message}
              style={{
                margin: 0,
                color: "hsl(var(--clr-neutral-100-b))",
              }}
            >
              {message}
            </p>
          ))}
        </div>
      </BottomSheet>
    </section>
  );
};

export default WorkoutReview;
