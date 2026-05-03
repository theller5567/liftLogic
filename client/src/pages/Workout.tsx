import { Check } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../components/Button";
import { completeWorkoutSession } from "../services/api";
import { getMostRecentPriorWeekExerciseLog } from "../utils/workoutAdvisory";
import { useWorkoutSessionRouteContext } from "./WorkoutSessionLayout";
import styles from "../styles/pages/workout.module.scss";

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

const Workout = () => {
  const navigate = useNavigate();
  const { priorSessions, session, setSession } = useWorkoutSessionRouteContext();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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
          {session.exerciseLogs.find((exerciseLog) => !exerciseLog.completed)
            ?.label ?? "All exercises complete"}
        </p>
        {session.exerciseLogs.map((exerciseLog, index) => {
          const previousExerciseLog = getMostRecentPriorWeekExerciseLog(
            exerciseLog,
            session,
            priorSessions
          );

          return (
            <button
              key={exerciseLog.slotId}
              type="button"
              className={
                exerciseLog.completed ? styles.exerciseItemComplete : styles.exerciseItem
              }
              onClick={() => navigate(`/workout/${session._id}/exercise/${index}`)}
            >
              <span>
                {exerciseLog.completed ? <Check size={16} /> : null}
              </span>
              <strong>{exerciseLog.label}</strong>
              <small>
                {exerciseLog.prescriptionSnapshot.sets} x{" "}
                {exerciseLog.prescriptionSnapshot.reps}
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
