import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import AppShell from "../components/app/AppShell";
import Button from "../components/Button";
import WorkoutPreview from "../components/WorkoutPreview";
import {
  clearWorkoutFocusBlock,
  isApiEnabled,
  markWorkoutPlanReviewed,
  saveEditedWorkoutPreview,
} from "../services/api";
import {
  getWorkoutFocusLabel,
  isWorkoutFocusBlockActive,
} from "../../../shared/utils/workoutFocus";
import type { GeneratedWorkoutPreview } from "../utils/generateWorkoutPreview";
import {
  resolveBaseWorkoutPreview,
  resolveCurrentWorkoutFocusBlock,
  resolveCurrentWorkoutPreview,
} from "../utils/workoutPlanPreview";
import {
  readEditedWorkoutPreview,
  writeWorkoutFocusBlock,
  writeWorkoutReviewed,
  writeEditedWorkoutPreview,
} from "../utils/workoutStorage";
import { useUserFlow } from "../utils/userFlow";
import pageStyles from "../styles/pages/page.module.scss";

const Plan = () => {
  const navigate = useNavigate();
  const apiEnabled = isApiEnabled();
  const { destination, error, isLoading, workoutPlan } = useUserFlow();
  const initialPreview = useMemo(
    () => resolveCurrentWorkoutPreview(workoutPlan),
    [workoutPlan]
  );
  const basePreview = useMemo(
    () => resolveBaseWorkoutPreview(workoutPlan),
    [workoutPlan]
  );
  const activeFocusBlock = useMemo(
    () => resolveCurrentWorkoutFocusBlock(workoutPlan),
    [workoutPlan]
  );
  const [localEditedPreview, setLocalEditedPreview] =
    useState<GeneratedWorkoutPreview | null>(() =>
      apiEnabled ? null : readEditedWorkoutPreview()
    );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [stopError, setStopError] = useState<string | null>(null);
  const [isStoppingSpecialization, setIsStoppingSpecialization] = useState(false);
  const [hasStoppedSpecialization, setHasStoppedSpecialization] = useState(false);

  const preview = hasStoppedSpecialization
    ? basePreview
    :
    initialPreview &&
    localEditedPreview?.programId === initialPreview.programId
      ? localEditedPreview
      : initialPreview;
  const isFocusActive =
    !hasStoppedSpecialization && isWorkoutFocusBlockActive(activeFocusBlock);

  if (isLoading) {
    return <p className="text-muted notificationMessage">Loading plan...</p>;
  }

  if (error) {
    return <p className="text-muted notificationMessage">We could not load your plan yet. Please refresh.</p>;
  }

  if (destination === "/onboarding" || destination === "/workout-review") {
    return <Navigate to={destination} replace />;
  }

  if (!preview) {
    return <Navigate to="/onboarding" replace />;
  }

  const handlePreviewChange = async (nextPreview: GeneratedWorkoutPreview) => {
    setSaveError(null);
    setLocalEditedPreview(nextPreview);
    writeEditedWorkoutPreview(nextPreview);
    writeWorkoutReviewed(true);

    if (apiEnabled) {
      try {
        await saveEditedWorkoutPreview(nextPreview);
        await markWorkoutPlanReviewed();
      } catch (error) {
        console.error("Failed to save workout preview to API", error);
        setSaveError("Your change is saved on this device, but we could not sync it yet.");
      }
    }
  };

  const stopSpecialization = async () => {
    setIsStoppingSpecialization(true);
    setStopError(null);

    try {
      if (apiEnabled) {
        await clearWorkoutFocusBlock();
      } else {
        writeWorkoutFocusBlock(null);
      }

      setHasStoppedSpecialization(true);
      setLocalEditedPreview(null);
    } catch (error) {
      setStopError(
        error instanceof Error
          ? error.message
          : "We could not stop this specialization block."
      );
    } finally {
      setIsStoppingSpecialization(false);
    }
  };

  return (
    <AppShell>
      <section className={`${pageStyles.shell} grid gap-4`}>
        <header className={`${pageStyles.reviewHero} grid gap-4`}>
          <div className="grid gap-3">
            <p className={pageStyles.eyebrow}>Workout Plan</p>
            <h1 className={pageStyles.title}>{preview.label}</h1>
            <p className={pageStyles.meta}>
              {preview.daysPerWeek} days per week • Goal: {preview.goal} • Unit: {preview.weightUnit}
            </p>
            {isFocusActive && activeFocusBlock ? (
              <div className={pageStyles.focusBanner}>
                <p className={pageStyles.focusPill}>
                  {getWorkoutFocusLabel(activeFocusBlock.focusArea)} specialization
                  active until{" "}
                  {new Intl.DateTimeFormat(undefined, {
                    month: "short",
                    day: "numeric",
                  }).format(new Date(activeFocusBlock.endsAt))}
                </p>
                <Button
                  disabled={isStoppingSpecialization}
                  label={isStoppingSpecialization ? "Stopping..." : "Stop block"}
                  size="small"
                  tone="gray"
                  variant="outline"
                  onClick={stopSpecialization}
                />
              </div>
            ) : null}
            <p className="sub-text">
              {isFocusActive
                ? "Review your specialization block. Stop it any time to return to your original plan."
                : "Review your program, adjust exercises when needed, and start from the dashboard when you are ready."}
            </p>
          </div>
          <Button
            label="Go to Dashboard"
            tone="primary"
            onClick={() => navigate("/dashboard")}
          />
          {saveError ? <p className="text-muted">{saveError}</p> : null}
          {stopError ? <p className="text-muted">{stopError}</p> : null}
        </header>

        <WorkoutPreview
          preview={preview}
          onPreviewChange={isFocusActive ? undefined : handlePreviewChange}
        />
      </section>
    </AppShell>
  );
};

export default Plan;
