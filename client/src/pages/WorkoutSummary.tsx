import clsx from "clsx";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import BottomSheet from "../components/BottomSheet";
import Button from "../components/Button";
import { deleteWorkoutSession, updateWorkoutSession } from "../services/api";
import { formatMonthDay } from "../utils/dateFormatting";
import { formatWorkoutDisplayLabel } from "../utils/workoutDisplayLabel";
import { useWorkoutSessionRouteContext } from "../utils/workoutSessionRouteContext";
import { useUserSettings } from "../utils/userSettings";
import {
  getCompletedExerciseCount,
  getCompletedSetCount,
  getTotalSetCount,
} from "../utils/workoutSessionStats";
import { formatSetSummary } from "../utils/workoutSetFormatting";
import {
  buildUserMessages,
  getUserMessagesForSurface,
  type UserMessage,
} from "../utils/userMessages";
import { workoutBadgeOptions } from "../../../shared/constants/workout-badges";
import type {
  WorkoutBadgeId,
  WorkoutExerciseLog,
} from "../../../shared/types/workoutSession.types";
import type {
  CurrentProgramScope,
  ExerciseHistoryScopeOptions,
} from "../../../shared/utils/workoutSessionScope";
import styles from "../styles/pages/workout.module.scss";

type ExerciseFeedbackDraft = {
  badgeIds: WorkoutBadgeId[];
  exerciseIndex: number;
  notes: string;
};

const getSummaryInsightClassName = (message: UserMessage) =>
  clsx(
    styles.summaryInsight,
    message.severity === "success" && styles.summaryInsightSuccess,
    message.severity === "warning" && styles.summaryInsightWarning,
    message.severity === "danger" && styles.summaryInsightDanger
  );

const WorkoutSummary = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { priorSessions, session, setSession } = useWorkoutSessionRouteContext();
  const { settings } = useUserSettings();
  const shouldOpenWorkoutNotes =
    typeof location.state === "object" &&
    location.state !== null &&
    "showWorkoutNotes" in location.state &&
    location.state.showWorkoutNotes === true;
  const [workoutNotes, setWorkoutNotes] = useState(session.notes ?? "");
  const [workoutBadgeIds, setWorkoutBadgeIds] = useState<WorkoutBadgeId[]>(
    session.badgeIds
  );
  const [isNotesSheetOpen, setIsNotesSheetOpen] = useState(
    shouldOpenWorkoutNotes
  );
  const [exerciseFeedbackDraft, setExerciseFeedbackDraft] =
    useState<ExerciseFeedbackDraft | null>(null);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isDeletingWorkout, setIsDeletingWorkout] = useState(false);
  const [isDeleteSheetOpen, setIsDeleteSheetOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const completedExerciseCount = getCompletedExerciseCount(session.exerciseLogs);
  const completedSetCount = getCompletedSetCount(session.exerciseLogs);
  const totalSetCount = getTotalSetCount(session.exerciseLogs);
  const currentProgramScope = useMemo<CurrentProgramScope>(
    () => ({
      activeProgramHistoryId: session.programHistoryId,
      programId: session.programId,
      programVersion: session.programVersion,
      workoutPlanId: session.workoutPlanId,
    }),
    [
      session.programHistoryId,
      session.programId,
      session.programVersion,
      session.workoutPlanId,
    ]
  );
  const exerciseHistoryScope = useMemo<ExerciseHistoryScopeOptions>(
    () => ({
      currentProgramScope,
      includePreviousPrograms:
        settings.exerciseHistory.includePreviousPrograms,
      resetCutoffs: settings.exerciseHistory.resetCutoffs,
    }),
    [
      currentProgramScope,
      settings.exerciseHistory.includePreviousPrograms,
      settings.exerciseHistory.resetCutoffs,
    ]
  );
  const summaryMessages = useMemo(
    () =>
      getUserMessagesForSurface(
        buildUserMessages({
          exerciseHistoryScope,
          messagePreferences: settings.messages,
          recentlyCompletedSessionId: session._id,
          sessions: [...priorSessions, session],
        }),
        "workout_summary"
      ),
    [exerciseHistoryScope, priorSessions, session, settings.messages]
  );

  const hasNoteChanges =
    workoutNotes.trim() !== (session.notes ?? "") ||
    workoutBadgeIds.join("|") !== session.badgeIds.join("|");
  const hasWorkoutFeedback =
    Boolean(session.notes) || session.badgeIds.length > 0;
  const hasExerciseDraftFeedback =
    Boolean(exerciseFeedbackDraft?.notes.trim()) ||
    Boolean(exerciseFeedbackDraft?.badgeIds.length);

  const toggleWorkoutBadge = (badgeId: WorkoutBadgeId) => {
    setWorkoutBadgeIds((currentBadgeIds) =>
      currentBadgeIds.includes(badgeId)
        ? currentBadgeIds.filter((currentBadgeId) => currentBadgeId !== badgeId)
        : [...currentBadgeIds, badgeId]
    );
  };

  const openExerciseFeedback = (
    exerciseLog: WorkoutExerciseLog,
    exerciseIndex: number
  ) => {
    setExerciseFeedbackDraft({
      badgeIds: exerciseLog.badgeIds,
      exerciseIndex,
      notes: exerciseLog.notes ?? "",
    });
  };

  const toggleExerciseFeedbackBadge = (badgeId: WorkoutBadgeId) => {
    setExerciseFeedbackDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft;
      }

      return {
        ...currentDraft,
        badgeIds: currentDraft.badgeIds.includes(badgeId)
          ? currentDraft.badgeIds.filter(
              (currentBadgeId) => currentBadgeId !== badgeId
            )
          : [...currentDraft.badgeIds, badgeId],
      };
    });
  };

  const saveWorkoutNotes = async () => {
    setIsSavingNotes(true);
    setSaveError(null);

    try {
      const { workoutSession } = await updateWorkoutSession(session._id, {
        badgeIds: workoutBadgeIds,
        notes: workoutNotes.trim() || null,
      });
      setSession(workoutSession);
      setWorkoutNotes(workoutSession.notes ?? "");
      setWorkoutBadgeIds(workoutSession.badgeIds);
      setIsNotesSheetOpen(false);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "We could not save your workout notes."
      );
    } finally {
      setIsSavingNotes(false);
    }
  };

  const clearWorkoutFeedback = async () => {
    setIsSavingNotes(true);
    setSaveError(null);

    try {
      const { workoutSession } = await updateWorkoutSession(session._id, {
        badgeIds: [],
        notes: null,
      });
      setSession(workoutSession);
      setWorkoutNotes("");
      setWorkoutBadgeIds([]);
      setIsNotesSheetOpen(false);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "We could not clear your workout notes."
      );
    } finally {
      setIsSavingNotes(false);
    }
  };

  const saveExerciseFeedback = async () => {
    if (!exerciseFeedbackDraft) {
      return;
    }

    setIsSavingNotes(true);
    setSaveError(null);

    const nextExerciseLogs = session.exerciseLogs.map((exerciseLog, index) =>
      index === exerciseFeedbackDraft.exerciseIndex
        ? {
            ...exerciseLog,
            badgeIds: exerciseFeedbackDraft.badgeIds,
            notes: exerciseFeedbackDraft.notes.trim() || undefined,
          }
        : exerciseLog
    );

    try {
      const { workoutSession } = await updateWorkoutSession(session._id, {
        exerciseLogs: nextExerciseLogs,
      });
      setSession(workoutSession);
      setExerciseFeedbackDraft(null);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "We could not save this exercise feedback."
      );
    } finally {
      setIsSavingNotes(false);
    }
  };

  const clearExerciseFeedback = async () => {
    if (!exerciseFeedbackDraft) {
      return;
    }

    setIsSavingNotes(true);
    setSaveError(null);

    const nextExerciseLogs = session.exerciseLogs.map((exerciseLog, index) =>
      index === exerciseFeedbackDraft.exerciseIndex
        ? {
            ...exerciseLog,
            badgeIds: [],
            notes: undefined,
          }
        : exerciseLog
    );

    try {
      const { workoutSession } = await updateWorkoutSession(session._id, {
        exerciseLogs: nextExerciseLogs,
      });
      setSession(workoutSession);
      setExerciseFeedbackDraft(null);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "We could not clear this exercise feedback."
      );
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleDeleteWorkout = async () => {
    setIsDeletingWorkout(true);
    setDeleteError(null);

    try {
      await deleteWorkoutSession(session._id);
      navigate("/dashboard", {
        replace: true,
        state: {
          statusMessage: `${formatWorkoutDisplayLabel(session.programDayLabel)} was deleted.`,
        },
      });
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "We could not delete this workout."
      );
    } finally {
      setIsDeletingWorkout(false);
    }
  };

  return (
    <section className={styles.workoutSummary}>
      <header className={styles.summaryHero}>
        <h1>
          <span>Workout</span>
          {formatWorkoutDisplayLabel(session.programDayLabel)}
        </h1>
        <span>{formatMonthDay(session.scheduledFor)}</span>
      </header>

      <div className={styles.summaryStats}>
        <article>
          <strong>{session.completionPercentage}%</strong>
          <span>Completed</span>
        </article>
        <article>
          <strong>
            {completedExerciseCount}/{session.exerciseLogs.length}
          </strong>
          <span>Exercises</span>
        </article>
        <article>
          <strong>
            {completedSetCount}/{totalSetCount}
          </strong>
          <span>Sets</span>
        </article>
      </div>

      {summaryMessages.length > 0 ? (
        <section className={styles.summaryInsights} aria-label="Workout insights">
          {summaryMessages.map((message) => (
            <article
              key={message.id}
              className={getSummaryInsightClassName(message)}
            >
              <p>{message.category.replace(/_/g, " ")}</p>
              <h2>{message.title}</h2>
              <span>{message.body}</span>
              {message.action?.to ? (
                <Button
                  label={message.action.label}
                  size="small"
                  tone="gray"
                  variant="outline"
                  onClick={() => navigate(message.action?.to ?? "/")}
                />
              ) : null}
            </article>
          ))}
        </section>
      ) : null}

      <article className={styles.summaryNotes}>
        <h2>Workout Notes</h2>
        <p className={styles.summaryNotePreview}>
          {session.notes ??
            "Add a quick reflection while the workout is still fresh."}
        </p>

        {session.badgeIds.length > 0 ? (
          <div className={styles.summaryBadgeGrid} aria-label="Saved workout badges">
            {session.badgeIds.map((badgeId) => {
              const badge = workoutBadgeOptions.find(
                (option) => option.id === badgeId
              );

              return badge ? (
                <span key={badge.id} className={styles.summaryBadgeSaved}>
                  {badge.label}
                </span>
              ) : null;
            })}
          </div>
        ) : null}
        <Button
          label={session.notes || session.badgeIds.length ? "Edit workout notes" : "Add workout notes"}
          tone="secondary"
          variant="outline"
          onClick={() => setIsNotesSheetOpen(true)}
        />
      </article>

      <article className={styles.summaryExerciseList}>
        <h2>Exercise Log</h2>
        {session.exerciseLogs.map((exerciseLog, exerciseIndex) => {
          const completedSets = exerciseLog.sets.filter(
            (setLog) => setLog.completed
          );
          const hasExerciseFeedback =
            Boolean(exerciseLog.notes) || exerciseLog.badgeIds.length > 0;

          return (
            <section key={exerciseLog.slotId} className={styles.summaryExercise}>
              <div>
                <h3>{exerciseLog.label}</h3>
                <span>
                  {completedSets.length}/{exerciseLog.sets.length} sets
                </span>
              </div>
              {completedSets.length > 0 ? (
                <ul>
                  {completedSets.map((setLog) => (
                    <li key={setLog.setNumber}>
                      <span>Set {setLog.setNumber}</span>
                      <strong>{formatSetSummary(setLog)}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No completed sets logged.</p>
              )}

              {exerciseLog.notes ? (
                <p className={styles.summaryExerciseNote}>
                  {exerciseLog.notes}
                </p>
              ) : null}

              {exerciseLog.badgeIds.length > 0 ? (
                <div
                  className={styles.summaryBadgeGrid}
                  aria-label={`${exerciseLog.label} progression badges`}
                >
                  {exerciseLog.badgeIds.map((badgeId) => {
                    const badge = workoutBadgeOptions.find(
                      (option) => option.id === badgeId
                    );

                    return badge ? (
                      <span key={badge.id} className={styles.summaryBadgeSaved}>
                        {badge.label}
                      </span>
                    ) : null;
                  })}
                </div>
              ) : null}

              <Button
                label={
                  hasExerciseFeedback
                    ? "Edit progression feedback"
                    : "Add progression feedback"
                }
                tone="secondary"
                variant="outline"
                size="small"
                onClick={() => openExerciseFeedback(exerciseLog, exerciseIndex)}
              />
            </section>
          );
        })}
      </article>

      <div className={styles.summaryActions}>
        <Button
          label="Back to dashboard"
          size="large"
          tone="primary"
          onClick={() => navigate("/dashboard")}
        />
        <Button
          label="Delete workout"
          size="small"
          tone="danger"
          variant="ghost"
          onClick={() => setIsDeleteSheetOpen(true)}
        />
      </div>

      <BottomSheet
        open={isNotesSheetOpen}
        onClose={() => setIsNotesSheetOpen(false)}
        title="How did this workout go?"
        eyebrow="Workout complete"
        description="Optional, but useful. These notes can help guide your next workout."
        variant="full"
        actions={[
          {
            label: hasNoteChanges ? "Save workout notes" : "Notes saved",
            tone: hasNoteChanges ? "primary" : "gray",
            disabled: !hasNoteChanges || isSavingNotes,
            loading: isSavingNotes,
            closeOnClick: false,
            onClick: saveWorkoutNotes,
          },
          {
            label: "Skip for now",
            tone: "gray",
            onClick: () => setIsNotesSheetOpen(false),
          },
        ]}
      >
        <div className={styles.summaryNotesForm}>
          <label>
            <span>Workout note</span>
            <textarea
              value={workoutNotes}
              maxLength={2000}
              placeholder="Example: Felt strong today. Keep bench the same next time and push rows."
              onChange={(event) => setWorkoutNotes(event.currentTarget.value)}
            />
          </label>

          <div className={styles.summaryPrompt}>
            <strong>Workout tags</strong>
            <p>
              Use these for the overall session. Exercise-specific tags can be
              added from each movement in the summary.
            </p>
          </div>

          <div className={styles.summaryBadgeGrid} aria-label="Workout badges">
            {workoutBadgeOptions.map((badge) => {
              const isSelected = workoutBadgeIds.includes(badge.id);

              return (
                <button
                  key={badge.id}
                  type="button"
                  className={clsx(
                    styles.summaryBadge,
                    isSelected && styles.summaryBadgeSelected
                  )}
                  aria-pressed={isSelected}
                  onClick={() => toggleWorkoutBadge(badge.id)}
                >
                  <strong>{badge.label}</strong>
                  <span>{badge.description}</span>
                </button>
              );
            })}
          </div>

          {hasWorkoutFeedback || workoutNotes.trim() || workoutBadgeIds.length ? (
            <Button
              label="Clear workout notes and tags"
              tone="danger"
              variant="ghost"
              size="small"
              disabled={isSavingNotes}
              onClick={clearWorkoutFeedback}
            />
          ) : null}

          {saveError ? <p className={styles.error}>{saveError}</p> : null}
        </div>
      </BottomSheet>

      <BottomSheet
        open={Boolean(exerciseFeedbackDraft)}
        onClose={() => setExerciseFeedbackDraft(null)}
        title={
          exerciseFeedbackDraft
            ? session.exerciseLogs[exerciseFeedbackDraft.exerciseIndex]?.label
            : "Exercise feedback"
        }
        eyebrow="Progression feedback"
        description="Tag anything that should shape the next recommendation for this movement."
        variant="full"
        actions={[
          {
            label: "Save feedback",
            tone: "primary",
            loading: isSavingNotes,
            closeOnClick: false,
            onClick: saveExerciseFeedback,
          },
          {
            label: "Cancel",
            tone: "gray",
            onClick: () => setExerciseFeedbackDraft(null),
          },
        ]}
      >
        {exerciseFeedbackDraft ? (
          <div className={styles.summaryNotesForm}>
            <label>
              <span>Exercise note</span>
              <textarea
                value={exerciseFeedbackDraft.notes}
                maxLength={1000}
                placeholder="Example: Completed the reps, but the last set got sloppy. Repeat this weight next time."
                onChange={(event) =>
                  setExerciseFeedbackDraft({
                    ...exerciseFeedbackDraft,
                    notes: event.currentTarget.value,
                  })
                }
              />
            </label>

            <div className={styles.summaryPrompt}>
              <strong>Progression tags</strong>
              <p>
                Felt hard, Improve form, Missed reps, and Pain can keep
                LiftLogic from pushing load too soon.
              </p>
            </div>

            <div
              className={styles.summaryBadgeGrid}
              aria-label="Exercise progression badges"
            >
              {workoutBadgeOptions.map((badge) => {
                const isSelected = exerciseFeedbackDraft.badgeIds.includes(
                  badge.id
                );

                return (
                  <button
                    key={badge.id}
                    type="button"
                    className={clsx(
                      styles.summaryBadge,
                      isSelected && styles.summaryBadgeSelected
                    )}
                    aria-pressed={isSelected}
                    onClick={() => toggleExerciseFeedbackBadge(badge.id)}
                  >
                    <strong>{badge.label}</strong>
                    <span>{badge.description}</span>
                  </button>
                );
              })}
            </div>

            {hasExerciseDraftFeedback ? (
              <Button
                label="Clear exercise feedback"
                tone="danger"
                variant="ghost"
                size="small"
                disabled={isSavingNotes}
                onClick={clearExerciseFeedback}
              />
            ) : null}

            {saveError ? <p className={styles.error}>{saveError}</p> : null}
          </div>
        ) : null}
      </BottomSheet>

      <BottomSheet
        open={isDeleteSheetOpen}
        onClose={() => {
          if (!isDeletingWorkout) {
            setIsDeleteSheetOpen(false);
          }
        }}
        title="Delete this workout?"
        eyebrow="Workout data"
        description="This removes the logged sets, notes, badges, and workout summary from your active history."
        closeOnOverlayClick={!isDeletingWorkout}
        actions={[
          {
            label: "Delete workout",
            tone: "danger",
            loading: isDeletingWorkout,
            closeOnClick: false,
            onClick: handleDeleteWorkout,
          },
          {
            label: "Keep workout",
            tone: "gray",
            disabled: isDeletingWorkout,
            onClick: () => setIsDeleteSheetOpen(false),
          },
        ]}
      >
        <div className={styles.deleteWorkoutConfirmation}>
          <p>
            LiftLogic will stop using this workout for trends, personal records,
            progressive overload, and coaching messages.
          </p>
          <p>
            The session is soft-deleted so future recovery/export tooling can
            handle it safely.
          </p>
          {deleteError ? <p className={styles.error}>{deleteError}</p> : null}
        </div>
      </BottomSheet>
    </section>
  );
};

export default WorkoutSummary;
