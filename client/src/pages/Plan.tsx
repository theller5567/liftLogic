import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import AppShell from "../components/app/AppShell";
import Button from "../components/Button";
import PageLoadingState from "../components/PageLoadingState";
import LoadingSpinner from "../components/LoadingSpinner";
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
import { getAvailableEquipmentFromAnswers } from "../../../shared/utils/equipmentRequirements";
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
import { updateCachedCurrentAppData } from "../utils/appDataCache";
import pageStyles from "../styles/pages/page.module.scss";

const Plan = () => {
  const navigate = useNavigate();
  const apiEnabled = isApiEnabled();
  const { destination, error, isLoading, refresh, refreshError, workoutPlan } =
    useUserFlow();
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
    : initialPreview && localEditedPreview?.programId === initialPreview.programId
      ? localEditedPreview
      : initialPreview;
  const isFocusActive =
    !hasStoppedSpecialization && isWorkoutFocusBlockActive(activeFocusBlock);

  if (isLoading) {
    return <LoadingSpinner fullScreen label="Loading plan..." />;
  }

  if (error) {
    return (
      <PageLoadingState
        tone="error"
        title="We could not load your plan"
        message={error.message}
        onAction={refresh}
      />
    );
  }

  if (
    destination === "/welcome" ||
    destination === "/onboarding" ||
    destination === "/workout-review"
  ) {
    return <Navigate to={destination} replace />;
  }

  if (!preview) {
    return <Navigate to="/welcome" replace />;
  }

  const handlePreviewChange = async (nextPreview: GeneratedWorkoutPreview) => {
    setSaveError(null);
    setLocalEditedPreview(nextPreview);
    writeEditedWorkoutPreview(nextPreview);
    writeWorkoutReviewed(true);

    if (apiEnabled) {
      try {
        const { workoutPlan: editedWorkoutPlan } =
          await saveEditedWorkoutPreview(nextPreview);
        updateCachedCurrentAppData({ workoutPlan: editedWorkoutPlan });
        const { workoutPlan } = await markWorkoutPlanReviewed();
        updateCachedCurrentAppData({ workoutPlan });
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
        const { workoutPlan } = await clearWorkoutFocusBlock();
        updateCachedCurrentAppData({ workoutPlan });
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
        {refreshError ? (
          <p className="text-muted">
            Showing your saved plan while we reconnect: {refreshError.message}
          </p>
        ) : null}
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
          availableEquipment={
            workoutPlan?.onboardingAnswers
              ? getAvailableEquipmentFromAnswers(workoutPlan.onboardingAnswers)
              : undefined
          }
          baselinePreview={(hasStoppedSpecialization ? basePreview : initialPreview) ?? preview}
          editPresentation="review_actions"
          onboardingAnswers={workoutPlan?.onboardingAnswers}
          preview={preview}
          onPreviewChange={isFocusActive ? undefined : handlePreviewChange}
        />
      </section>
    </AppShell>
  );
};

export default Plan;
