import { Info } from "lucide-react";

import Button from "../Button";
import styles from "../../styles/pages/exercisePage.module.scss";
import { formatTimer } from "../../utils/workoutSetFormatting";

type WorkoutRestTimerCardProps = {
  activeExerciseRestSeconds: number;
  onStartRestTimer: () => void;
  restSeconds: number | null;
};

const WorkoutRestTimerCard = ({
  activeExerciseRestSeconds,
  onStartRestTimer,
  restSeconds,
}: WorkoutRestTimerCardProps) => (
  <aside className={styles.restTimerCard}>
    <span>
      <Info size={18} />
    </span>
    <div>
      <strong>
        Rest Timer:{" "}
        {restSeconds !== null && restSeconds > 0
          ? formatTimer(restSeconds)
          : formatTimer(activeExerciseRestSeconds)}
      </strong>
      <p>Take your time. Quality reps over rushing.</p>
    </div>
    <Button
      label={
        restSeconds !== null && restSeconds > 0 ? "Timer active" : "Start timer"
      }
      size="medium"
      tone="secondary"
      variant="outline"
      onClick={onStartRestTimer}
    />
  </aside>
);

export default WorkoutRestTimerCard;
