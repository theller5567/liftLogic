import { Check } from "lucide-react";

import type { WorkoutSessionDto } from "../../../../shared/types/workoutSession.types";
import Barbell from "../../assets/icons/021-barbell.svg?react";
import { getMostRecentPriorWeekExerciseLog } from "../../utils/workoutAdvisory";
import { areAllWorkoutExercisesCompleted } from "../../utils/workoutSessionStats";
import styles from "../../styles/pages/workout.module.scss";

type ExerciseUiState = "available" | "completed";

type WorkoutExerciseListProps = {
  currentSession: WorkoutSessionDto;
  onSelectExercise: (exerciseIndex: number) => void;
  priorSessions: WorkoutSessionDto[];
};

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

const getExerciseUiState = (isCompleted: boolean): ExerciseUiState =>
  isCompleted ? "completed" : "available";

const getExerciseClassName = (exerciseState: ExerciseUiState) => {
  if (exerciseState === "completed") {
    return styles.exerciseItemComplete;
  }

  return styles.exerciseItem;
};

const WorkoutExerciseList = ({
  currentSession,
  onSelectExercise,
  priorSessions,
}: WorkoutExerciseListProps) => {
  const allExercisesCompleted = areAllWorkoutExercisesCompleted(
    currentSession.exerciseLogs
  );

  return (
    <article className={styles.exerciseList}>
      <p>
        {allExercisesCompleted ? "All exercises complete" : "Choose an exercise"}
      </p>
      {currentSession.exerciseLogs.map((exerciseLog, index) => {
        const exerciseState = getExerciseUiState(exerciseLog.completed);
        const previousExerciseLog = getMostRecentPriorWeekExerciseLog(
          exerciseLog,
          currentSession,
          priorSessions
        );

        return (
          <button
            key={exerciseLog.slotId}
            type="button"
            className={getExerciseClassName(exerciseState)}
            onClick={() => onSelectExercise(index)}
          >
            <span>{exerciseLog.completed ? <Check size={16} /> : <Barbell />}</span>

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
  );
};

export default WorkoutExerciseList;
