import { Link } from "react-router-dom";

import Button from "../Button";
import type { GeneratedWorkoutDayPreview } from "../../utils/generateWorkoutPreview";
import styles from "../../styles/components/dashboard.module.scss";

type WorkoutCardProps = {
  date: Date;
  workoutDay: GeneratedWorkoutDayPreview | null;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
});

const WorkoutCard = ({ date, workoutDay }: WorkoutCardProps) => (
  <section className={styles.workoutSection}>
    <div className={styles.workoutHeading}>
      <div>
        <h2>Today's Workout</h2>
        <span>{dateFormatter.format(date)}</span>
      </div>
      <p>0% Completed</p>
    </div>

    {workoutDay ? (
      <>
        <article className={styles.workoutCard}>
          <h3>{workoutDay.label}</h3>
          <div className={styles.exerciseTags}>
            {workoutDay.exercises.slice(0, 4).map((exercise) => (
              <span key={exercise.id}>{exercise.label}</span>
            ))}
          </div>
          <p className={styles.lastSessionLabel}>Last Session:</p>
          <p className={styles.emptyMetric}>No sessions logged yet</p>
        </article>
        <Link className={styles.startLink} to="/workout">
          <Button label="Start Workout" size="large" tone="primary" />
        </Link>
      </>
    ) : (
      <article className={styles.emptyWorkoutCard}>
        <h3>No workout scheduled</h3>
        <p>Pick another day in the week to view your planned sessions.</p>
      </article>
    )}
  </section>
);

export default WorkoutCard;
