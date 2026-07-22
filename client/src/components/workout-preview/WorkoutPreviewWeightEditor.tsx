import clsx from "clsx";

import type { LoadFeasibilityResult } from "../../../../shared/utils/loadFeasibility";
import type { GeneratedWorkoutExercisePreview } from "../../utils/generateWorkoutPreview";
import Button from "../Button";
import StepButton from "../StepButton";
import styles from "../../styles/components/workoutPreview.module.scss";

type WorkoutPreviewWeightEditorProps = {
  draftWeight: number;
  feasibility?: LoadFeasibilityResult;
  getWeightStep: () => number;
  onUseSuggestedWeight?: (weight: number) => void;
  selectedEditExercise: GeneratedWorkoutExercisePreview;
  updateDraftWeight: (amount: number) => void;
};

const WorkoutPreviewWeightEditor = ({
  draftWeight,
  feasibility,
  getWeightStep,
  onUseSuggestedWeight,
  selectedEditExercise,
  updateDraftWeight,
}: WorkoutPreviewWeightEditorProps) => {
  const shouldShowWarning =
    feasibility?.status === "too_heavy" || feasibility?.status === "limit";
  const suggestedWeight = feasibility?.suggestedWeight;

  return (
    <section className={clsx(styles.editorSection, "grid gap-3 border-subtle")}>
      <div className={styles.headerContent}>
        <h3 className={styles.sectionTitle}>Starting Weight</h3>
        <p className={styles.recommendedWeightCopy}>
          Current draft: <span>{draftWeight}</span>{" "}
          {selectedEditExercise.weightUnit}
        </p>
        <p>
          You should be able to complete {selectedEditExercise.prescription.reps}.
        </p>
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
      {feasibility ? (
        <div
          className={clsx(
            styles.feasibilityPanel,
            shouldShowWarning && styles.feasibilityPanelWarning
          )}
          role={shouldShowWarning ? "alert" : "status"}
        >
          <div>
            <strong>{feasibility.reason}</strong>
            {suggestedWeight !== undefined ? (
              <p>
                Suggested for this prescription: {suggestedWeight}{" "}
                {selectedEditExercise.weightUnit}
              </p>
            ) : null}
          </div>
          {shouldShowWarning &&
          suggestedWeight !== undefined &&
          suggestedWeight !== draftWeight &&
          onUseSuggestedWeight ? (
            <Button
              label="Use suggested weight"
              size="small"
              tone="primary"
              onClick={() => onUseSuggestedWeight(suggestedWeight)}
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
};

export default WorkoutPreviewWeightEditor;
