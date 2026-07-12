import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import AppShell from "../components/app/AppShell";
import Button from "../components/Button";
import WorkoutPreview from "../components/WorkoutPreview";
import {
  isApiEnabled,
  markWorkoutPlanReviewed,
  saveEditedWorkoutPreview,
} from "../services/api";
import type { GeneratedWorkoutPreview } from "../utils/generateWorkoutPreview";
import { resolveCurrentWorkoutPreview } from "../utils/workoutPlanPreview";
import {
  readEditedWorkoutPreview,
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
  const [localEditedPreview, setLocalEditedPreview] =
    useState<GeneratedWorkoutPreview | null>(() =>
      apiEnabled ? null : readEditedWorkoutPreview()
    );
  const [saveError, setSaveError] = useState<string | null>(null);

  const preview =
    initialPreview &&
    localEditedPreview?.programId === initialPreview.programId
      ? localEditedPreview
      : initialPreview;

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
            <p className="sub-text">
              Review your program, adjust exercises when needed, and start from the dashboard when you are ready.
            </p>
          </div>
          <Button
            label="Go to Dashboard"
            tone="primary"
            onClick={() => navigate("/dashboard")}
          />
          {saveError ? <p className="text-muted">{saveError}</p> : null}
        </header>

        <WorkoutPreview preview={preview} onPreviewChange={handlePreviewChange} />
      </section>
    </AppShell>
  );
};

export default Plan;
