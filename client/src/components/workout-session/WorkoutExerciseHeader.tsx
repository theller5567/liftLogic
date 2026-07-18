import { ArrowLeft, MoreVertical } from "lucide-react";
import clsx from "clsx";

import type { WorkoutExerciseLog } from "../../../../shared/types/workoutSession.types";
import InfoData from "../../assets/icons/info.svg?react";
import styles from "../../styles/pages/exercisePage.module.scss";

type WorkoutExerciseHeaderProps = {
  activeExerciseIndex: number;
  exerciseLogs: WorkoutExerciseLog[];
  onBack: () => void;
  onOpenExerciseInfo: () => void;
  showExerciseInfo: boolean;
};

const WorkoutExerciseHeader = ({
  activeExerciseIndex,
  exerciseLogs,
  onBack,
  onOpenExerciseInfo,
  showExerciseInfo,
}: WorkoutExerciseHeaderProps) => (
  <header className={styles.exerciseHeader}>
    <button type="button" aria-label="Back to workout" onClick={onBack}>
      <ArrowLeft size={16} />
    </button>
    <div className={styles.exerciseProgress}>
      <p>
        Exercise {activeExerciseIndex + 1} of {exerciseLogs.length}
      </p>
      <div className={styles.progressBars}>
        {exerciseLogs.map((exerciseLog, index) => (
          <span
            key={exerciseLog.slotId}
            className={clsx(
              exerciseLog.completed && styles.progressComplete,
              index === activeExerciseIndex && styles.progressActive
            )}
          />
        ))}
      </div>
    </div>
    {showExerciseInfo ? (
      <button
        type="button"
        className={styles.exerciseInfoButton}
        aria-label="Open full exercise information"
        data-tooltip="Open full exercise information"
        onClick={onOpenExerciseInfo}
      >
        <InfoData className={styles.infoDataIcon} />
      </button>
    ) : (
      <button type="button" aria-label="Exercise options">
        <MoreVertical size={18} />
      </button>
    )}
  </header>
);

export default WorkoutExerciseHeader;
