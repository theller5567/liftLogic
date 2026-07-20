import { useMemo, useState } from "react";
import clsx from "clsx";
import { Navigate, useNavigate } from "react-router-dom";
import CheckMark from "../assets/icons/078-check.svg?react";

import type {
  WorkoutFocusArea,
  WorkoutFocusBlock,
} from "../../../shared/types/workoutFocus.types";
import type { OnboardingAnswers } from "../../../shared/types/onboarding.types";
import {
  WORKOUT_FOCUS_AREA_LABELS,
  WORKOUT_FOCUS_DURATION_WEEKS,
} from "../../../shared/types/workoutFocus.types";
import AppShell from "../components/app/AppShell";
import BottomSheet from "../components/BottomSheet";
import Button from "../components/Button";
import PageLoadingState from "../components/PageLoadingState";
import LoadingSpinner from "../components/LoadingSpinner";
import WorkoutTemplateBrowser from "../components/WorkoutTemplateBrowser";
import WorkoutPreview from "../components/WorkoutPreview";
import {
  isApiEnabled,
  markWorkoutPlanReviewed,
  type ProgramSwitchOptions,
  saveEditedWorkoutPreview,
  submitOnboardingAnswers,
} from "../services/api";
import { generateWorkoutPreview } from "../utils/generateWorkoutPreview";
import type { GeneratedWorkoutPreview } from "../utils/generateWorkoutPreview";
import {
  getRankedWorkoutTemplateRecommendations,
} from "../../../shared/utils/workoutTemplateRecommendations";
import { getAvailableEquipmentFromAnswers } from "../../../shared/utils/equipmentRequirements";
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
import { updateCachedCurrentAppData } from "../utils/appDataCache";
import pageStyles from "../styles/pages/page.module.scss";

const focusAreaOptions = Object.entries(WORKOUT_FOCUS_AREA_LABELS).map(
  ([value, label]) => ({
    label,
    value: value as WorkoutFocusArea,
  })
);

type SyncStatus = "idle" | "saving" | "saved_local" | "synced" | "failed";
type PendingTemplateSwitch = {
  nextAnswers: OnboardingAnswers;
  templateId: string;
};

const WorkoutReview = () => {
  const navigate = useNavigate();
  const {
    destination,
    error,
    isLoading,
    refresh,
    refreshError,
    workoutPlan: remoteWorkoutPlan,
  } = useUserFlow();
  const submittedAnswers =
    remoteWorkoutPlan?.onboardingAnswers ?? readSubmittedAnswers();
  const [localAnswers, setLocalAnswers] = useState<typeof submittedAnswers>(null);
  const [localEditedPreview, setLocalEditedPreview] =
    useState<GeneratedWorkoutPreview | null>(() => readEditedWorkoutPreview());
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [previewSyncStatus, setPreviewSyncStatus] =
    useState<SyncStatus>("idle");
  const [templateSyncStatus, setTemplateSyncStatus] =
    useState<SyncStatus>("idle");
  const [lastFailedPreview, setLastFailedPreview] =
    useState<GeneratedWorkoutPreview | null>(null);
  const [lastFailedTemplateId, setLastFailedTemplateId] =
    useState<string | null>(null);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);
  const [isCompletingReview, setIsCompletingReview] = useState(false);
  const [showEditWarning, setShowEditWarning] = useState(false);
  const [showFocusOffer, setShowFocusOffer] = useState(false);
  const [showPlanBrowser, setShowPlanBrowser] = useState(false);
  const [pendingTemplateSwitch, setPendingTemplateSwitch] =
    useState<PendingTemplateSwitch | null>(null);
  const [abandonInProgressSessions, setAbandonInProgressSessions] =
    useState(true);
  const [preserveExerciseHistory, setPreserveExerciseHistory] = useState(true);
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
  const planExplanation = recommendation?.explanation;
  const hasPendingRequest =
    previewSyncStatus === "saving" ||
    templateSyncStatus === "saving" ||
    isCompletingReview;

  if (isLoading) {
    return <LoadingSpinner fullScreen label="Loading workout review..." />;
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
    setPreviewSyncStatus("saving");
    setLastFailedPreview(null);
    setLocalEditedPreview(nextPreview);
    writeEditedWorkoutPreview(nextPreview);
    writeWorkoutReviewed(false);

    if (isApiEnabled()) {
      try {
        const { workoutPlan } = await saveEditedWorkoutPreview(nextPreview);
        updateCachedCurrentAppData({ workoutPlan });
        setPreviewSyncStatus("synced");
      } catch (error) {
        console.error("Failed to save workout preview to API", error);
        setLastFailedPreview(nextPreview);
        setPreviewSyncStatus("failed");
        setReviewError(
          "Your exercise edit is saved on this device, but it has not synced yet. Check your connection and retry before switching devices."
        );
      }
      return;
    }

    setPreviewSyncStatus("saved_local");
  };

  const submitTemplateSelect = async (
    { nextAnswers, templateId }: PendingTemplateSwitch,
    switchOptions?: ProgramSwitchOptions
  ) => {
    if (!activeAnswers || templateSyncStatus === "saving") {
      return;
    }

    setReviewError(null);
    setTemplateSyncStatus("saving");
    setPendingTemplateId(templateId);
    setLastFailedTemplateId(null);
    setLocalAnswers(nextAnswers);
    setLocalEditedPreview(null);
    writeSubmittedAnswers(nextAnswers);
    writeEditedWorkoutPreview(null);
    writeWorkoutReviewed(false);

    if (isApiEnabled()) {
      try {
        const { profile, workoutPlan } =
          await submitOnboardingAnswers(nextAnswers, switchOptions);
        updateCachedCurrentAppData({ profile, workoutPlan });
        setTemplateSyncStatus("synced");
      } catch (error) {
        console.error("Failed to save selected workout template", error);
        setLastFailedTemplateId(templateId);
        setTemplateSyncStatus("failed");
        setReviewError(
          "Your plan choice is saved on this device, but it has not synced yet. Check your connection and retry before switching devices."
        );
      } finally {
        setPendingTemplateId(null);
        setShowPlanBrowser(false);
        setPendingTemplateSwitch(null);
      }
      return;
    }

    setTemplateSyncStatus("saved_local");
    setPendingTemplateId(null);
    setShowPlanBrowser(false);
    setPendingTemplateSwitch(null);
  };

  const handleTemplateSelect = (templateId: string) => {
    if (!activeAnswers || templateSyncStatus === "saving") {
      return;
    }

    if (templateId === preview.programId) {
      setShowPlanBrowser(false);
      return;
    }

    const nextAnswers = {
      ...activeAnswers,
      onboardingMode: activeAnswers.onboardingMode ?? "browse",
      selectedWorkoutTemplateId: templateId,
    };
    const nextSwitch = { nextAnswers, templateId };

    if (remoteWorkoutPlan?.workoutReviewed) {
      setPendingTemplateSwitch(nextSwitch);
      setShowPlanBrowser(false);
      return;
    }

    void submitTemplateSelect(nextSwitch);
  };

  const markReviewComplete = async () => {
    if (isCompletingReview) {
      return;
    }

    setReviewError(null);
    setIsCompletingReview(true);

    if (isApiEnabled()) {
      try {
        const { workoutPlan } = await markWorkoutPlanReviewed();
        updateCachedCurrentAppData({ workoutPlan });
      } catch (error) {
        console.error("Failed to mark workout review complete in API", error);
        setReviewError("We could not save your workout review. Please try again.");
        setIsCompletingReview(false);
        return;
      }
    }

    writeWorkoutReviewed(true);
    setIsCompletingReview(false);
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
    if (hasPendingRequest) {
      return;
    }

    if (hasEdits) {
      setShowEditWarning(true);
      return;
    }

    setShowFocusOffer(true);
  };

  const retryPreviewSync = () => {
    if (lastFailedPreview) {
      void handlePreviewChange(lastFailedPreview);
    }
  };

  const retryTemplateSync = () => {
    if (lastFailedTemplateId) {
      void handleTemplateSelect(lastFailedTemplateId);
    }
  };

  const selectedSwitchPreview = pendingTemplateSwitch
    ? generateWorkoutPreview(pendingTemplateSwitch.nextAnswers)
    : null;

  return (
    <AppShell>
      <section className={clsx(pageStyles.shell, "grid gap-2")}>
      {refreshError ? (
        <p className="text-muted">
          Showing your saved review while we reconnect: {refreshError.message}
        </p>
      ) : null}
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
          {planExplanation?.whyThisPlan.length ? (
            <div className={pageStyles.summaryList}>
              <p><strong>Why this plan?</strong></p>
              {planExplanation.whyThisPlan.map((reason) => (
                <p key={reason}><CheckMark className={clsx(pageStyles.checkmarkIcon)} />{reason}</p>
              ))}
            </div>
          ) : null}
          {planExplanation?.tradeoffs.length ? (
            <div className={clsx(pageStyles.summaryList, pageStyles.tradeoffList)}>
              <p><strong>Tradeoffs</strong></p>
              {planExplanation.tradeoffs.map((tradeoff) => (
                <p key={tradeoff}>{tradeoff}</p>
              ))}
            </div>
          ) : null}
          {planExplanation?.thingsToCheck.length ? (
            <div
              className={clsx(pageStyles.summaryList, pageStyles.warningList)}
              role="status"
            >
              <p><strong>Things to check</strong></p>
              {planExplanation.thingsToCheck.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          ) : null}
          {planExplanation?.suggestedSubstitutions.length ? (
            <div className={clsx(pageStyles.summaryList, pageStyles.substitutionList)}>
              <p><strong>Suggested substitutions</strong></p>
              {planExplanation.suggestedSubstitutions.map((suggestion) => (
                <p key={suggestion}>{suggestion}</p>
              ))}
            </div>
          ) : null}
          
        </div>
        <div className="flex">
          <Button
            disabled={hasPendingRequest}
            label="View other plans"
            tone="white"
            variant="outline"
            icon="reminder"
            iconSize="medium"
            onClick={() => setShowPlanBrowser(true)}
          />
          <Button
            disabled={hasPendingRequest}
            loading={isCompletingReview}
            label={
              isCompletingReview
                ? "Saving..."
                : hasEdits
                  ? "Continue with edits"
                  : "Continue to Program"
            }
            tone="primary"
            icon="chevronRight"
            iconPosition="right"
            onClick={handleContinue}
          />
        </div>
        {previewSyncStatus !== "idle" ? (
          <div
            className={clsx(
              pageStyles.statusMessage,
              previewSyncStatus === "failed" && pageStyles.statusMessageError
            )}
            role={previewSyncStatus === "failed" ? "alert" : "status"}
          >
            <p>
              {previewSyncStatus === "saving"
                ? "Saving exercise changes..."
                : previewSyncStatus === "synced"
                  ? "Exercise changes synced."
                  : previewSyncStatus === "saved_local"
                    ? "Exercise changes saved on this device."
                    : "Exercise changes are saved on this device, but not synced yet."}
            </p>
            {previewSyncStatus === "failed" && lastFailedPreview ? (
              <Button
                disabled={hasPendingRequest}
                label="Retry sync"
                size="small"
                tone="white"
                variant="outline"
                onClick={retryPreviewSync}
              />
            ) : null}
          </div>
        ) : null}
        {templateSyncStatus !== "idle" ? (
          <div
            className={clsx(
              pageStyles.statusMessage,
              templateSyncStatus === "failed" && pageStyles.statusMessageError
            )}
            role={templateSyncStatus === "failed" ? "alert" : "status"}
          >
            <p>
              {templateSyncStatus === "saving"
                ? "Updating your plan..."
                : templateSyncStatus === "synced"
                  ? "Plan choice synced."
                  : templateSyncStatus === "saved_local"
                    ? "Plan choice saved on this device."
                    : "Plan choice is saved on this device, but not synced yet."}
            </p>
            {templateSyncStatus === "failed" && lastFailedTemplateId ? (
              <Button
                disabled={hasPendingRequest}
                label="Retry sync"
                size="small"
                tone="white"
                variant="outline"
                onClick={retryTemplateSync}
              />
            ) : null}
          </div>
        ) : null}
        {reviewError ? <p className="text-muted">{reviewError}</p> : null}
      </header>

      <WorkoutPreview
        availableEquipment={getAvailableEquipmentFromAnswers(activeAnswers)}
        editPresentation="review_actions"
        onboardingAnswers={activeAnswers}
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
          disabled={templateSyncStatus === "saving"}
          pendingTemplateId={pendingTemplateId}
          selectedTemplateId={preview.programId}
          onSelectTemplate={handleTemplateSelect}
        />
      </BottomSheet>

      <BottomSheet
        open={Boolean(pendingTemplateSwitch)}
        onClose={() => {
          if (templateSyncStatus !== "saving") {
            setPendingTemplateSwitch(null);
          }
        }}
        eyebrow="Program switch"
        title="Switch workout program?"
        description="Your completed workouts will stay saved. Weekly progress will restart for the new program."
        closeOnOverlayClick={templateSyncStatus !== "saving"}
        actions={[
          {
            disabled: templateSyncStatus === "saving" || !pendingTemplateSwitch,
            loading: templateSyncStatus === "saving",
            label:
              templateSyncStatus === "saving"
                ? "Switching..."
                : "Switch program",
            tone: "primary",
            closeOnClick: false,
            onClick: () => {
              if (!pendingTemplateSwitch) {
                return;
              }

              void submitTemplateSelect(pendingTemplateSwitch, {
                abandonInProgressSessions,
                preserveExerciseHistory,
              });
            },
          },
          {
            disabled: templateSyncStatus === "saving",
            label: "Keep current plan",
            tone: "gray",
            variant: "outline",
            onClick: () => setPendingTemplateSwitch(null),
          },
        ]}
      >
        <div className={pageStyles.switchConfirmation}>
          <p>
            Current plan: <strong>{preview.label}</strong>
          </p>
          {selectedSwitchPreview ? (
            <p>
              New plan: <strong>{selectedSwitchPreview.label}</strong>
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

      <BottomSheet
        open={showEditWarning}
        onClose={() => setShowEditWarning(false)}
        eyebrow="Before You Continue"
        variant="full"
        title="Keep these edits?"
        description="Your changes have been saved, but the original recommendations are usually the best place to start."
        actions={[
          {
            disabled: hasPendingRequest,
            loading: isCompletingReview,
            label: isCompletingReview ? "Saving..." : "Continue with edits",
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
        description="A focus block is a planned training phase that emphasizes one muscle group with additional volume and recovery while keeping the rest of your program at maintenance."
        actions={[
          {
            disabled: hasPendingRequest,
            loading: isCompletingReview,
            label: isCompletingReview ? "Saving..." : "Skip for now",
            tone: "white",
            variant: "outline",
            onClick: completeReview,
            closeOnClick: false,
          },
          {
            disabled: hasPendingRequest,
            loading: isCompletingReview,
            label: isCompletingReview ? "Saving..." : "Review focus block",
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
    </AppShell>
  );
};

export default WorkoutReview;
