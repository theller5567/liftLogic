import clsx from "clsx";

import type { GeneratedWorkoutExercisePreview } from "../../utils/generateWorkoutPreview";
import StepButton from "../StepButton";
import styles from "../../styles/components/workoutPreview.module.scss";

type WorkoutPreviewWeightEditorProps = {
  draftWeight: number;
  getWeightStep: () => number;
  selectedEditExercise: GeneratedWorkoutExercisePreview;
  updateDraftWeight: (amount: number) => void;
};

const WorkoutPreviewWeightEditor = ({
  draftWeight,
  getWeightStep,
  selectedEditExercise,
  updateDraftWeight,
}: WorkoutPreviewWeightEditorProps) => (
  <section className={clsx(styles.editorSection, "grid gap-3 border-subtle")}>
    <div className={styles.headerContent}>
      <h3 className={styles.sectionTitle}>Starting Weight</h3>
      <p className={styles.recommendedWeightCopy}>
        Recommended: <span>{draftWeight}</span> lb
      </p>
      <p>You should be able to complete {selectedEditExercise.prescription.reps}.</p>
    </div>
    <div className={styles.weightStepper}>
      <StepButton
        type="decrement"
        size="large"
        onClick={() => updateDraftWeight(-getWeightStep())}
      />
      <div className={styles.weightInputWrapper}>
        <div
          id={`starting-weight-input-${selectedEditExercise.id}`}
          className={styles.weightInput}
        >
          {draftWeight}
        </div>
        <span className={styles.weightUnit}>{selectedEditExercise.weightUnit}</span>
      </div>
      <StepButton
        type="increment"
        size="large"
        onClick={() => updateDraftWeight(getWeightStep())}
      />
    </div>
  </section>
);

export default WorkoutPreviewWeightEditor;
