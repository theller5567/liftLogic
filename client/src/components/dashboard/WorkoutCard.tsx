import { Link } from "react-router-dom";

import Button from "../Button";
import { Timer } from "lucide-react";
import type { GeneratedWorkoutDayPreview } from "../../utils/generateWorkoutPreview";
import styles from "../../styles/components/dashboard.module.scss";

type WorkoutCardProps = {
  availableWorkoutDays: GeneratedWorkoutDayPreview[];
  date: Date;
  onSelectWorkout: (workoutDayId: string) => void;
  workoutDay: GeneratedWorkoutDayPreview | null;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
});

const WorkoutCard = ({
  availableWorkoutDays,
  date,
  onSelectWorkout,
  workoutDay,
}: WorkoutCardProps) => {
  const swapOptions = availableWorkoutDays.filter(
    (availableWorkout) => availableWorkout.id !== workoutDay?.id
  );

  return (
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
            <header>
            <div>
            <h3>{workoutDay.label}</h3>
            <p>{workoutDay.focus}</p>
            </div>
            
            <span className={styles.pill}>{workoutDay.exercises.length} Exercises</span>
            </header>
            <div className={styles.exerciseTags}>
              {workoutDay.exercises.slice(0, 4).map((exercise) => (
                <span key={exercise.id}>{exercise.label}</span>
              ))}
            </div>
            <div className={styles.dataCta}>
              <div className={styles.lastSession}>
              <Timer className="text-secondary" />
                <div>
              <p className={styles.lastSessionLabel}>Last Session:</p>
              <p className={styles.emptyMetric}>No sessions logged yet</p>
              </div>
              </div>
              <div className={styles.progress}>
                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. </p>
              </div>
            </div>
            {swapOptions.length > 0 ? (
              <div className={styles.switchWorkout}>
                <p>Switch workout</p>
                <div className={styles.switchWorkoutOptions}>
                  {swapOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => onSelectWorkout(option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </article>
          <Link className={styles.startLink} to="/workout">
            <Button label="Start Workout" size="large" tone="primary" />
          </Link>
        </>
      ) : (
        <article className={styles.emptyWorkoutCard}>
          <h3>All workouts complete</h3>
          <p>All workouts for this week are complete.</p>
        </article>
      )}
    </section>
  );
};

export default WorkoutCard;
