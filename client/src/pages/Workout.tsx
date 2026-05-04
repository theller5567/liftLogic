import { Check } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../components/Button";
import { completeWorkoutSession } from "../services/api";
import { getMostRecentPriorWeekExerciseLog } from "../utils/workoutAdvisory";
import { useWorkoutSessionRouteContext } from "../utils/workoutSessionRouteContext";
import styles from "../styles/pages/workout.module.scss";

type ExerciseUiState = "active" | "completed" | "inactive";

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

const getActiveExerciseIndex = (
  exerciseLogs: ReturnType<typeof useWorkoutSessionRouteContext>["session"]["exerciseLogs"]
) => exerciseLogs.findIndex((exerciseLog) => !exerciseLog.completed);

const getExerciseUiState = (
  isCompleted: boolean,
  exerciseIndex: number,
  activeExerciseIndex: number
): ExerciseUiState => {
  if (isCompleted) {
    return "completed";
  }

  return exerciseIndex === activeExerciseIndex ? "active" : "inactive";
};

const getExerciseClassName = (exerciseState: ExerciseUiState) => {
  if (exerciseState === "completed") {
    return styles.exerciseItemComplete;
  }

  if (exerciseState === "active") {
    return styles.exerciseItemActive;
  }

  return styles.exerciseItemInactive;
};

const Workout = () => {
  const navigate = useNavigate();
  const { priorSessions, session, setSession } = useWorkoutSessionRouteContext();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const activeExerciseIndex = getActiveExerciseIndex(session.exerciseLogs);
  const activeExercise = session.exerciseLogs[activeExerciseIndex] ?? null;

  const handleCompleteWorkout = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const { workoutSession } = await completeWorkoutSession(session._id, {
        exerciseLogs: session.exerciseLogs,
      });
      setSession(workoutSession);
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
          <p>{session.programDayLabel},</p>
          <h1>{dateFormatter.format(new Date(session.scheduledFor))}</h1>
        </div>
        <span>{session.completionPercentage}%</span>
      </header>

      <div className={styles.progressMeta}>
        <p>
          {session.completedExerciseCount} of {session.totalExerciseCount} exercises completed
        </p>
        <div className={styles.progressTrack}>
          <span style={{ width: `${session.completionPercentage}%` }} />
        </div>
      </div>

      {saveError ? <p className={styles.error}>{saveError}</p> : null}

      <article className={styles.exerciseList}>
        <p>
          Active Exercise:{" "}
          {activeExercise?.label ?? "All exercises complete"}
        </p>
        {session.exerciseLogs.map((exerciseLog, index) => {
          const exerciseState = getExerciseUiState(
            exerciseLog.completed,
            index,
            activeExerciseIndex
          );
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
                {exerciseLog.completed ? <Check size={16} /> : null}
              </span>
              <strong>{exerciseLog.label}</strong>
              <small>
                {exerciseState === "active" ? "Active" : null}
                {exerciseState !== "active"
                  ? `${exerciseLog.prescriptionSnapshot.sets} x ${exerciseLog.prescriptionSnapshot.reps}`
                  : null}
              </small>
              <em>{getPreviousLogSummary(previousExerciseLog)}</em>
            </button>
          );
        })}
      </article>

      <div className={styles.footerActions}>
        <Button
          disabled={isSaving || session.status === "completed"}
          label={session.status === "completed" ? "Workout completed" : "Finish workout"}
          size="large"
          tone="black"
          onClick={handleCompleteWorkout}
        />
      </div>
    </section>
  );
};

export default Workout;
