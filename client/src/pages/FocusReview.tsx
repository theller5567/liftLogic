import { useMemo, useState } from "react";
import clsx from "clsx";
import { Navigate, useNavigate } from "react-router-dom";

import type { WorkoutFocusBlock } from "../../../shared/types/workoutFocus.types";
import {
  applyWorkoutFocusBlock,
  createWorkoutFocusBlock,
  getIntroducedFocusExerciseIds,
  getWorkoutFocusLabel,
  getWorkoutFocusTargetDayCount,
} from "../../../shared/utils/workoutFocus";
import { getExerciseById } from "../../../shared/utils/exerciseLibraryAdapter";
import AppShell from "../components/app/AppShell";
import Button from "../components/Button";
import PageLoadingState from "../components/PageLoadingState";
import WorkoutPreview from "../components/WorkoutPreview";
import {
  isApiEnabled,
  saveWorkoutFocusBlock,
} from "../services/api";
import { generateWorkoutPreview } from "../utils/generateWorkoutPreview";
import type { GeneratedWorkoutPreview } from "../utils/generateWorkoutPreview";
import LoadingSpinner from "../components/LoadingSpinner";
import { useUserFlow } from "../utils/userFlow";
import { updateCachedCurrentAppData } from "../utils/appDataCache";
import {
  readEditedWorkoutPreview,
  readPendingWorkoutFocusBlock,
  readSubmittedAnswers,
  writePendingWorkoutFocusBlock,
  writeWorkoutFocusBlock,
} from "../utils/workoutStorage";
import pageStyles from "../styles/pages/page.module.scss";

const countFocusedDays = (
  preview: GeneratedWorkoutPreview,
  focusArea: WorkoutFocusBlock["focusArea"]
) =>
  preview.days.filter((day) =>
    day.exercises.some((exercise) => {
      const definition = getExerciseById(exercise.exerciseId);

      return (
        definition?.primaryMuscles.includes(focusArea) ||
        definition?.secondaryMuscles.includes(focusArea)
      );
    })
  ).length;

const getBasePreview = (
  workoutPlan: ReturnType<typeof useUserFlow>["workoutPlan"]
) => {
  if (workoutPlan) {
    return workoutPlan.editedPreview ?? workoutPlan.suggestedPreview;
  }

  const submittedAnswers = readSubmittedAnswers();

  if (!submittedAnswers) {
    return null;
  }

  const suggestedPreview = generateWorkoutPreview(submittedAnswers);
  const editedPreview = readEditedWorkoutPreview();

  return editedPreview?.programId === suggestedPreview.programId
    ? editedPreview
    : suggestedPreview;
};

const FocusReview = () => {
  const navigate = useNavigate();
  const apiEnabled = isApiEnabled();
  const { destination, error, isLoading, refresh, refreshError, workoutPlan } =
    useUserFlow();
  const pendingFocusBlock = readPendingWorkoutFocusBlock();
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const basePreview = useMemo(() => getBasePreview(workoutPlan), [workoutPlan]);
  const pendingBlock = useMemo(
    () =>
      pendingFocusBlock
        ? createWorkoutFocusBlock({
            durationWeeks: pendingFocusBlock.durationWeeks,
            focusArea: pendingFocusBlock.focusArea,
          })
        : null,
    [pendingFocusBlock]
  );
  const generatedFocusedPreview = useMemo(
    () =>
      basePreview && pendingBlock
        ? applyWorkoutFocusBlock(basePreview, pendingBlock)
        : null,
    [basePreview, pendingBlock]
  );
  const [reviewedPreview, setReviewedPreview] =
    useState<GeneratedWorkoutPreview | null>(null);
  const focusedPreview = reviewedPreview ?? generatedFocusedPreview;
  const editableExerciseIds = useMemo(
    () =>
      basePreview && generatedFocusedPreview
        ? getIntroducedFocusExerciseIds(basePreview, generatedFocusedPreview)
        : new Set<string>(),
    [basePreview, generatedFocusedPreview]
  );
  const introducedExercises = useMemo(
    () =>
      focusedPreview
        ? focusedPreview.days
            .flatMap((day) => day.exercises)
            .filter((exercise) => editableExerciseIds.has(exercise.id))
        : [],
    [editableExerciseIds, focusedPreview]
  );

  if (isLoading) {
    return <LoadingSpinner fullScreen label="Loading review..." />;
  }

  if (error) {
    return (
      <PageLoadingState
        tone="error"
        title="We could not load this review"
        message={error.message}
        onAction={refresh}
      />
    );
  }

  if (destination && destination !== "/dashboard") {
    return <Navigate to={destination} replace />;
  }

  if (!pendingFocusBlock) {
    return <Navigate to="/settings" replace />;
  }

  if (!basePreview || !pendingBlock || !focusedPreview) {
    return <Navigate to="/onboarding" replace />;
  }

  const focusedDayCount = countFocusedDays(
    focusedPreview,
    pendingFocusBlock.focusArea
  );
  const targetDayCount = getWorkoutFocusTargetDayCount(basePreview);

  const activateSpecialization = async () => {
    setIsActivating(true);
    setReviewError(null);

    try {
      if (apiEnabled) {
        const { workoutPlan } = await saveWorkoutFocusBlock({
          durationWeeks: pendingFocusBlock.durationWeeks,
          focusArea: pendingFocusBlock.focusArea,
          reviewedPreview: focusedPreview,
        });
        updateCachedCurrentAppData({ workoutPlan });
      } else {
        writeWorkoutFocusBlock(
          createWorkoutFocusBlock({
            durationWeeks: pendingFocusBlock.durationWeeks,
            focusArea: pendingFocusBlock.focusArea,
            reviewedPreview: focusedPreview,
          })
        );
      }

      writePendingWorkoutFocusBlock(null);
      navigate("/plan");
    } catch (activationError) {
      setReviewError(
        activationError instanceof Error
          ? activationError.message
          : "We could not activate this specialization block."
      );
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <AppShell>
      <section className={clsx(pageStyles.shell, "grid gap-4")}>
        {refreshError ? (
          <p className="text-muted">
            Showing your saved focus review while we reconnect:{" "}
            {refreshError.message}
          </p>
        ) : null}
        <header className={clsx(pageStyles.reviewHero, "grid gap-4")}>
          <div className="grid gap-3">
            <p className={clsx("text-secondary", pageStyles.eyebrow)}>
              Specialization Review
            </p>
            <h1 className={pageStyles.title}>
              {getWorkoutFocusLabel(pendingFocusBlock.focusArea)} block
            </h1>
            <p className={pageStyles.meta}>
              {pendingFocusBlock.durationWeeks} weeks • {focusedDayCount} focused
              workouts per week • {introducedExercises.length} introduced
              exercises
            </p>
            <p className="sub-text">
              Review the temporary changes and swap newly added exercises if your
              equipment does not fit.
            </p>
          </div>
          <div className={pageStyles.summaryList}>
            <p>
              <strong>{focusedDayCount}</strong> of{" "}
              <strong>{basePreview.days.length}</strong> workouts train{" "}
              {getWorkoutFocusLabel(pendingFocusBlock.focusArea).toLowerCase()}.
            </p>
            <p>
              Target: at least <strong>{targetDayCount}</strong> focused workouts
              per week during this block.
            </p>
            {introducedExercises.length > 0 ? (
              <p>
                New exercises:{" "}
                {introducedExercises.map((exercise) => exercise.label).join(", ")}
              </p>
            ) : null}
          </div>
          <div className="flex">
            <Button
              disabled={isActivating}
              label={isActivating ? "Activating..." : "Activate specialization"}
              tone="primary"
              onClick={activateSpecialization}
            />
            <Button
              disabled={isActivating}
              label="Back to Settings"
              tone="gray"
              variant="outline"
              onClick={() => navigate("/settings")}
            />
          </div>
          {reviewError ? <p className="text-muted">{reviewError}</p> : null}
        </header>

        <WorkoutPreview
          editableExerciseIds={editableExerciseIds}
          preview={focusedPreview}
          onPreviewChange={setReviewedPreview}
        />
      </section>
    </AppShell>
  );
};

export default FocusReview;
