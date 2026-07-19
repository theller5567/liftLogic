import clsx from "clsx";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import BottomSheet from "../components/BottomSheet";
import Button from "../components/Button";
import { updateWorkoutSession } from "../services/api";
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
  const [saveError, setSaveError] = useState<string | null>(null);
  const completedExerciseCount = getCompletedExerciseCount(session.exerciseLogs);
  const completedSetCount = getCompletedSetCount(session.exerciseLogs);
  const totalSetCount = getTotalSetCount(session.exerciseLogs);
  const summaryMessages = useMemo(
    () =>
      getUserMessagesForSurface(
        buildUserMessages({
          messagePreferences: settings.messages,
          recentlyCompletedSessionId: session._id,
          sessions: [...priorSessions, session],
        }),
        "workout_summary"
      ),
    [priorSessions, session, settings.messages]
  );

  const hasNoteChanges =
    workoutNotes.trim() !== (session.notes ?? "") ||
    workoutBadgeIds.join("|") !== session.badgeIds.join("|");

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

            {saveError ? <p className={styles.error}>{saveError}</p> : null}
          </div>
        ) : null}
      </BottomSheet>
    </section>
  );
};

export default WorkoutSummary;
