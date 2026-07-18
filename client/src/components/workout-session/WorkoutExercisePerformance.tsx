import type { RefObject } from "react";
import clsx from "clsx";

import type {
  WorkoutExerciseLog,
  WorkoutSetLog,
} from "../../../../shared/types/workoutSession.types";
import Target from "../../assets/icons/target.svg?react";
import styles from "../../styles/pages/exercisePage.module.scss";
import {
  getDefaultReps,
  getDefaultWeight,
} from "../../utils/workoutSetFormatting";
import { formatWorkoutDisplayLabel } from "../../utils/workoutDisplayLabel";

type SetUiState = "active" | "completed" | "inactive";

type WorkoutExercisePerformanceProps = {
  activeExercise: WorkoutExerciseLog;
  activeSetIndex: number;
  completedSetCount: number;
  previousDisplaySet?: WorkoutSetLog;
  previousExerciseLog?: WorkoutExerciseLog;
  programDayLabel: string;
  todaySetRefs: RefObject<Record<number, HTMLDivElement | null>>;
};

const getSetUiState = (
  setLog: WorkoutSetLog,
  setIndex: number,
  activeSetIndex: number
): SetUiState => {
  if (setLog.completed) {
    return "completed";
  }

  return setIndex === activeSetIndex ? "active" : "inactive";
};

const WorkoutExercisePerformance = ({
  activeExercise,
  activeSetIndex,
  completedSetCount,
  previousDisplaySet,
  previousExerciseLog,
  programDayLabel,
  todaySetRefs,
}: WorkoutExercisePerformanceProps) => (
  <div className={styles.exerciseMeta}>
    <div className={styles.exerciseTitle}>
      <div>
        <h1>{activeExercise.label}</h1>
        <p>
          <Target /> {formatWorkoutDisplayLabel(programDayLabel)}
        </p>
      </div>
      <span>
        {completedSetCount} / {activeExercise.sets.length} sets
      </span>
    </div>

    <div className={styles.performanceGrid}>
      <section className={styles.previousPerformance}>
        <p>Previous</p>
        {previousDisplaySet ? (
          <div className={styles.previousCard}>
            <span>Set {previousDisplaySet.setNumber}</span>
            <strong>
              {previousDisplaySet.weight ??
                previousExerciseLog?.prescriptionSnapshot.suggestedWeight ??
                0}
            </strong>
            <small>
              {previousDisplaySet.weightUnit ??
                previousExerciseLog?.prescriptionSnapshot.weightUnit ??
                activeExercise.prescriptionSnapshot.weightUnit}
              {" x "}
              {getDefaultReps(previousDisplaySet)}
            </small>
          </div>
        ) : (
          <div className={styles.previousCard}>
            <strong>N/A</strong>
          </div>
        )}
      </section>

      <section className={styles.currentPerformance}>
        <p>Today</p>
        <div className={styles.todaySetScroller}>
          {activeExercise.sets.map((setLog, setIndex) => {
            const setState = getSetUiState(setLog, setIndex, activeSetIndex);

            return (
              <div
                key={setLog.setNumber}
                ref={(node) => {
                  todaySetRefs.current[setIndex] = node;
                }}
                className={clsx(
                  styles.todaySetTile,
                  setState === "completed" && styles.todaySetComplete,
                  setState === "active" && styles.todaySetActive
                )}
              >
                <span>Set {setLog.setNumber}</span>
                <strong>{getDefaultWeight(activeExercise, setLog)}</strong>
                <small>
                  {setLog.weightUnit ?? activeExercise.prescriptionSnapshot.weightUnit}
                  {" x "}
                  {getDefaultReps(setLog)}
                </small>
              </div>
            );
          })}
        </div>
      </section>
    </div>
    <small>
      We suggest a weight you can complete {activeExercise.prescriptionSnapshot.reps}{" "}
      reps with good form.
    </small>
  </div>
);

export default WorkoutExercisePerformance;
