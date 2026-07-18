import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import Button from "../components/Button";
import WorkoutExerciseList from "../components/workout-session/WorkoutExerciseList";
import { completeWorkoutSession } from "../services/api";
import { formatMonthDay } from "../utils/dateFormatting";
import { formatWorkoutDisplayLabel } from "../utils/workoutDisplayLabel";
import {
  areAllWorkoutExercisesCompleted,
  getCompletedExerciseCount,
  getNextIncompleteExerciseIndex,
  getTotalExerciseCount,
  getWorkoutCompletionPercentage,
  isWorkoutSessionCompleted,
} from "../utils/workoutSessionStats";
import { useWorkoutSessionRouteContext } from "../utils/workoutSessionRouteContext";
import styles from "../styles/pages/workout.module.scss";

const Workout = () => {
  const navigate = useNavigate();
  const { priorSessions, session, setSession } = useWorkoutSessionRouteContext();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const nextIncompleteExerciseIndex = getNextIncompleteExerciseIndex(
    session.exerciseLogs
  );
  const completedExerciseCount = getCompletedExerciseCount(session.exerciseLogs);
  const totalExerciseCount = getTotalExerciseCount(session.exerciseLogs);
  const allExercisesCompleted = areAllWorkoutExercisesCompleted(
    session.exerciseLogs
  );
  const completionPercentage = getWorkoutCompletionPercentage(
    session.exerciseLogs
  );
  const isWorkoutCompleted = isWorkoutSessionCompleted(session);
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
          <h1>{formatMonthDay(session.scheduledFor)}</h1>
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

      <WorkoutExerciseList
        currentSession={session}
        onSelectExercise={(index) =>
          navigate(`/workout/${session._id}/exercise/${index}`)
        }
        priorSessions={priorSessions}
      />

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
