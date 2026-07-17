import { Check } from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import Button from "../components/Button";
import Barbell from "../assets/icons/021-barbell.svg?react";
import { completeWorkoutSession } from "../services/api";
import { getMostRecentPriorWeekExerciseLog } from "../utils/workoutAdvisory";
import { formatWorkoutDisplayLabel } from "../utils/workoutDisplayLabel";
import { useWorkoutSessionRouteContext } from "../utils/workoutSessionRouteContext";
import styles from "../styles/pages/workout.module.scss";

type ExerciseUiState = "available" | "completed";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
});

const getPreviousLogSummary = (
  previousExerciseLog: ReturnType<typeof getMostRecentPriorWeekExerciseLog>
) => {
  if (!previousExerciseLog) {
    return "No previous log";
  }

  const completedSets = previousExerciseLog.sets.filter(
    (setLog) => setLog.completed
  );

  if (completedSets.length === 0) {
    return "No completed sets last time";
  }

  return `Last: ${completedSets
    .map((setLog) => `${setLog.weight ?? 0} x ${setLog.actualReps ?? 0}`)
    .join(" | ")}`;
};

const getNextIncompleteExerciseIndex = (
  exerciseLogs: ReturnType<
    typeof useWorkoutSessionRouteContext
  >["session"]["exerciseLogs"]
) => exerciseLogs.findIndex((exerciseLog) => !exerciseLog.completed);

const getExerciseUiState = (isCompleted: boolean): ExerciseUiState =>
  isCompleted ? "completed" : "available";

const getExerciseClassName = (exerciseState: ExerciseUiState) => {
  if (exerciseState === "completed") {
    return styles.exerciseItemComplete;
  }

  return styles.exerciseItem;
};

const Workout = () => {
  const navigate = useNavigate();
  const { priorSessions, session, setSession } = useWorkoutSessionRouteContext();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const nextIncompleteExerciseIndex = getNextIncompleteExerciseIndex(
    session.exerciseLogs
  );
  const completedExerciseCount = session.exerciseLogs.filter(
    (exerciseLog) => exerciseLog.completed
  ).length;
  const totalExerciseCount = session.exerciseLogs.length;
  const allExercisesCompleted =
    totalExerciseCount > 0 && completedExerciseCount === totalExerciseCount;
  const completionPercentage =
    totalExerciseCount > 0
      ? Math.round((completedExerciseCount / totalExerciseCount) * 100)
      : 0;
  const isWorkoutCompleted =
    session.status === "completed" || allExercisesCompleted;
  const workoutActionLabel = isWorkoutCompleted
    ? "Save and view summary"
    : completedExerciseCount > 0
      ? "Continue workout"
      : "Choose an exercise";

  if (session.status === "completed") {
    return <Navigate to={`/workout/${session._id}/summary`} replace />;
  }

  const handleCompleteWorkout = async () => {
    if (!allExercisesCompleted) {
      const nextExerciseIndex =
        nextIncompleteExerciseIndex >= 0 ? nextIncompleteExerciseIndex : 0;
      navigate(`/workout/${session._id}/exercise/${nextExerciseIndex}`);
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const { workoutSession } = await completeWorkoutSession(session._id, {
        exerciseLogs: session.exerciseLogs,
      });
      setSession(workoutSession);
      navigate(`/workout/${workoutSession._id}/summary`);
    } catch (completeError) {
      setSaveError(
        completeError instanceof Error
          ? completeError.message
          : "We could not complete this workout yet."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className={styles.workout}>
      <header className={styles.header}>
        <div>
          <p>Workout</p>
          <strong>{formatWorkoutDisplayLabel(session.programDayLabel)}</strong>
          <h1>{dateFormatter.format(new Date(session.scheduledFor))}</h1>
        </div>
        <span>{completionPercentage}%</span>
      </header>

      <div className={styles.progressMeta}>
        <p>
          {completedExerciseCount} of {totalExerciseCount} exercises completed
        </p>
        <div className={styles.progressTrack}>
          <span style={{ width: `${completionPercentage}%` }} />
        </div>
      </div>

      {saveError ? <p className={styles.error}>{saveError}</p> : null}

      <article className={styles.exerciseList}>
        <p>
          {allExercisesCompleted
            ? "All exercises complete"
            : "Choose an exercise"}
        </p>
        {session.exerciseLogs.map((exerciseLog, index) => {
          const exerciseState = getExerciseUiState(exerciseLog.completed);
          const previousExerciseLog = getMostRecentPriorWeekExerciseLog(
            exerciseLog,
            session,
            priorSessions
          );

          return (
            <button
              key={exerciseLog.slotId}
              type="button"
              className={getExerciseClassName(exerciseState)}
              onClick={() => navigate(`/workout/${session._id}/exercise/${index}`)}
            >
              <span>
                {exerciseLog.completed ? <Check size={16} /> : <Barbell />}
              </span>

              <div className={styles.exerciseLabel}>
                <strong>{exerciseLog.label}</strong>
                <em>{getPreviousLogSummary(previousExerciseLog)}</em>
              </div>

              <small className={styles.exercisePill}>
                {exerciseState === "completed" ? "Completed" : "Start"}
              </small>
            </button>
          );
        })}
      </article>

      <div className={styles.footerActions}>
        <Button
          disabled={isSaving}
          loading={isSaving}
          label={workoutActionLabel}
          size="large"
          tone={isWorkoutCompleted ? "primary" : "black"}
          onClick={handleCompleteWorkout}
        />
      </div>
    </section>
  );
};

export default Workout;
