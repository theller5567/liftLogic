import { useNavigate } from "react-router-dom";

import Button from "../components/Button";
import type { WorkoutSetLog } from "../../../shared/types/workoutSession.types";
import { useWorkoutSessionRouteContext } from "../utils/workoutSessionRouteContext";
import styles from "../styles/pages/workout.module.scss";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
});

const formatSetSummary = (setLog: WorkoutSetLog) => {
  const weight = setLog.weight ?? 0;
  const unit = setLog.weightUnit ?? "";
  const reps = setLog.actualReps ?? 0;

  return `${weight}${unit} x ${reps}`;
};

const WorkoutSummary = () => {
  const navigate = useNavigate();
  const { session } = useWorkoutSessionRouteContext();
  const completedExercises = session.exerciseLogs.filter(
    (exerciseLog) => exerciseLog.completed
  );
  const completedSetCount = session.exerciseLogs.reduce(
    (totalSets, exerciseLog) =>
      totalSets + exerciseLog.sets.filter((setLog) => setLog.completed).length,
    0
  );
  const totalSetCount = session.exerciseLogs.reduce(
    (totalSets, exerciseLog) => totalSets + exerciseLog.sets.length,
    0
  );

  return (
    <section className={styles.workoutSummary}>
      <header className={styles.summaryHero}>
        <p>Workout complete</p>
        <h1>{session.programDayLabel}</h1>
        <span>{dateFormatter.format(new Date(session.scheduledFor))}</span>
      </header>

      <div className={styles.summaryStats}>
        <article>
          <strong>{session.completionPercentage}%</strong>
          <span>Completed</span>
        </article>
        <article>
          <strong>
            {completedExercises.length}/{session.exerciseLogs.length}
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
    </section>
  );
};

export default WorkoutSummary;
