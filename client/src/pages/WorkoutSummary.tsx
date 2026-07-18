import clsx from "clsx";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import BottomSheet from "../components/BottomSheet";
import Button from "../components/Button";
import { updateWorkoutSession } from "../services/api";
import { formatMonthDay } from "../utils/dateFormatting";
import { formatWorkoutDisplayLabel } from "../utils/workoutDisplayLabel";
import { useWorkoutSessionRouteContext } from "../utils/workoutSessionRouteContext";
import {
  getCompletedExerciseCount,
  getCompletedSetCount,
  getTotalSetCount,
} from "../utils/workoutSessionStats";
import { formatSetSummary } from "../utils/workoutSetFormatting";
import { workoutBadgeOptions } from "../../../shared/constants/workout-badges";
import type { WorkoutBadgeId } from "../../../shared/types/workoutSession.types";
import styles from "../styles/pages/workout.module.scss";

const WorkoutSummary = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, setSession } = useWorkoutSessionRouteContext();
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
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const completedExerciseCount = getCompletedExerciseCount(session.exerciseLogs);
  const completedSetCount = getCompletedSetCount(session.exerciseLogs);
  const totalSetCount = getTotalSetCount(session.exerciseLogs);

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
        {session.exerciseLogs.map((exerciseLog) => {
          const completedSets = exerciseLog.sets.filter(
            (setLog) => setLog.completed
          );

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
                  {badge.label}
                </button>
              );
            })}
          </div>

          {saveError ? <p className={styles.error}>{saveError}</p> : null}
        </div>
      </BottomSheet>
    </section>
  );
};

export default WorkoutSummary;
