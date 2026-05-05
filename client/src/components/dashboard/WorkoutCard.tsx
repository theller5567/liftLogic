import Button from "../Button";
import { Timer } from "lucide-react";
import type { GeneratedWorkoutDayPreview } from "../../utils/generateWorkoutPreview";
import { formatWorkoutDisplayLabel } from "../../utils/workoutDisplayLabel";
import styles from "../../styles/components/dashboard.module.scss";
import { useNavigate } from "react-router-dom";

type WorkoutCardProps = {
  actionLabel?: string;
  availableWorkoutDays: GeneratedWorkoutDayPreview[];
  completionPercentage?: number;
  date: Date;
  isStartingWorkout?: boolean;
  isWorkoutActive?: boolean;
  isWorkoutCompleted?: boolean;
  onSelectWorkout: (workoutDayId: string) => void;
  onStartWorkout: () => void;
  workoutDay: GeneratedWorkoutDayPreview | null;
  sessionId?: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
});

const WorkoutCard = ({
  actionLabel = "Start Workout",
  availableWorkoutDays,
  completionPercentage = 0,
  date,
  isStartingWorkout = false,
  isWorkoutActive = false,
  isWorkoutCompleted = false,
  sessionId,
  onSelectWorkout,
  onStartWorkout,
  workoutDay,
}: WorkoutCardProps) => {
  const swapOptions = availableWorkoutDays.filter(
    (availableWorkout) => availableWorkout.id !== workoutDay?.id
  );
  const navigate = useNavigate();

  const todaysDate = new Date();
  const isSelectedDateToday =
    todaysDate.getFullYear() === date.getFullYear() &&
    todaysDate.getMonth() === date.getMonth() &&
    todaysDate.getDate() === date.getDate();
  const sessionSummary =
    isWorkoutCompleted
      ? "100% complete. Your summary is ready."
      : isWorkoutActive
        ? "Pick up where you left off."
        : "Ready when you are.";

  return (
    <section className={styles.workoutSection}>
      <div className={styles.workoutHeading}>
        <div>
          <h2>Today's Workout</h2>
          <span>{dateFormatter.format(date)}</span>
        </div>
        <p>{completionPercentage}% Completed</p>
      </div>

      {workoutDay ? (
        <>
          <article className={styles.workoutCard}>
            <header>
            <div>
            <h3>
              <span>Workout</span>
              {formatWorkoutDisplayLabel(workoutDay.label)}
            </h3>
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
              <p className={styles.lastSessionLabel}>Today's Session:</p>
              <p className={styles.emptyMetric}>
                {isWorkoutCompleted
                  ? "Workout completed"
                  : isWorkoutActive
                    ? "Workout in progress"
                    : "No sessions logged yet"}
              </p>
              </div>
              </div>
              <div className={styles.progress}>
                <p>{sessionSummary}</p>
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
                      {formatWorkoutDisplayLabel(option.label)}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </article>
          <div className={styles.startLink}>
            {!isWorkoutCompleted && isSelectedDateToday ? (
              <Button
              disabled={isStartingWorkout || isWorkoutCompleted}
              label={
                isStartingWorkout
                  ? "Opening..."
                  : isWorkoutCompleted
                    ? "Workout Completed"
                    : actionLabel
              }
              size="large"
              tone="primary"
              onClick={onStartWorkout}
              />
            ) : null}
          </div>
          {isWorkoutCompleted && (
            <div className={styles.completedMessage}>
              <p><span>Great work completing today's workout!</span>See you tomorrow for the next session.</p>
              {sessionId ? (
                <Button
                  label="View workout summary"
                  size="large"
                  tone="secondary"
                  onClick={() => navigate(`/workout/${sessionId}/summary`)}
                />
              ) : null}
            </div>
          )}
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
