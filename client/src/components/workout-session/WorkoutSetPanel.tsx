import { Check, ChevronRight, ChevronUp, Minus, Plus } from "lucide-react";
import clsx from "clsx";

import type {
  WorkoutExerciseLog,
  WorkoutSetLog,
} from "../../../../shared/types/workoutSession.types";
import ActiveSet from "../../assets/icons/activeSet.svg?react";
import Button from "../Button";
import styles from "../../styles/pages/exercisePage.module.scss";
import {
  formatSetSummary,
  getDefaultReps,
  getDefaultWeight,
} from "../../utils/workoutSetFormatting";

type SetUiState = "active" | "completed" | "inactive";

type WorkoutSetPanelProps = {
  activeExercise: WorkoutExerciseLog;
  isSaving: boolean;
  onLogSet: (setIndex: number) => void;
  onOpenNoteBadge: (setIndex: number) => void;
  onOpenPlateCalculator: (setIndex: number) => void;
  onRepsChange: (setIndex: number, direction: "decrease" | "increase") => void;
  onWeightChange: (
    setIndex: number,
    direction: "decrease" | "increase"
  ) => void;
  setIndex: number;
  setLog: WorkoutSetLog;
  setState: SetUiState;
  showPlateCalculator?: boolean;
};

const getSetClassName = (setState: SetUiState) => {
  if (setState === "completed") {
    return styles.setComplete;
  }

  if (setState === "active") {
    return styles.setActive;
  }

  return styles.setInactive;
};

const WorkoutSetPanel = ({
  activeExercise,
  isSaving,
  onLogSet,
  onOpenNoteBadge,
  onOpenPlateCalculator,
  onRepsChange,
  onWeightChange,
  setIndex,
  setLog,
  setState,
  showPlateCalculator = false,
}: WorkoutSetPanelProps) => {
  const isActiveSet = setState === "active";

  return (
    <section className={clsx(styles.setPanel, getSetClassName(setState))}>
      <header>
        <span className={styles.setStatusIcon}>
          {setState === "completed" ? <Check size={18} /> : <ActiveSet />}
        </span>
        <div>
          <h2>Set {setLog.setNumber}</h2>
          <small>{setLog.targetReps} reps</small>
        </div>
        {setState === "completed" ? (
          <>
            <strong>{formatSetSummary(setLog)}</strong>
            <ChevronRight size={22} />
          </>
        ) : null}
        {setState === "active" ? (
          <>
            <em>Current set</em>
            <ChevronUp size={22} />
          </>
        ) : null}
        {setState === "inactive" ? <ChevronRight size={22} /> : null}
      </header>

      {isActiveSet ? (
        <>
          <div className={styles.stepperRow}>
            <p>Weight</p>
            <div className={styles.stepper}>
              <button
                type="button"
                aria-label="Decrease weight"
                onClick={() => onWeightChange(setIndex, "decrease")}
              >
                <Minus size={18} />
              </button>
              <strong>
                {getDefaultWeight(activeExercise, setLog)}{" "}
                {setLog.weightUnit ?? activeExercise.prescriptionSnapshot.weightUnit}
              </strong>
              <button
                type="button"
                aria-label="Increase weight"
                onClick={() => onWeightChange(setIndex, "increase")}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          <div className={styles.stepperRow}>
            <p>Reps</p>
            <div className={styles.stepper}>
              <button
                type="button"
                aria-label="Decrease reps"
                onClick={() => onRepsChange(setIndex, "decrease")}
              >
                <Minus size={18} />
              </button>
              <strong>{getDefaultReps(setLog)}</strong>
              <button
                type="button"
                aria-label="Increase reps"
                onClick={() => onRepsChange(setIndex, "increase")}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
          <div className="flex">
            <Button
              type="button"
              label="Add Note or Badge"
              className={styles.noteAction}
              icon="edit"
              tone="secondary"
              variant="outline"
              onClick={() => onOpenNoteBadge(setIndex)}
            />
            {showPlateCalculator ? (
              <Button
                type="button"
                label="View Plate Calculator"
                className={styles.noteAction}
                icon="calculator"
                tone="secondary"
                variant="outline"
                onClick={() => onOpenPlateCalculator(setIndex)}
              />
            ) : null}
          </div>

          <Button
            disabled={isSaving}
            loading={isSaving}
            label="Log set"
            size="large"
            tone="primary"
            onClick={() => onLogSet(setIndex)}
          />
        </>
      ) : null}
    </section>
  );
};

export default WorkoutSetPanel;
