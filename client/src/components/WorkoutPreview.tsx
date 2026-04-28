import { type ChangeEvent, useState } from "react";
import clsx from "clsx";

import BottomSheet from "./BottomSheet";
import Button from "./Button";
import Pill from "./Pill";
import StepButton from "./StepButton";
import styles from "../styles/components/workoutPreview.module.scss";
import type { GeneratedWorkoutPreview } from "../utils/generateWorkoutPreview";
import type {
  GeneratedWorkoutExerciseAlternative,
  GeneratedWorkoutExercisePreview,
} from "../utils/generateWorkoutPreview";

type WorkoutPreviewProps = {
  preview: GeneratedWorkoutPreview;
  onPreviewChange: (preview: GeneratedWorkoutPreview) => void;
};

type SelectedEditExercise = GeneratedWorkoutExercisePreview;

type MovementOption = GeneratedWorkoutExerciseAlternative & {
  isCurrent?: boolean;
};

const formatRestLabel = (restSeconds: number) => {
  const minutes = Math.floor(restSeconds / 60);
  const seconds = restSeconds % 60;

  if (minutes > 0 && seconds > 0) {
    return `${minutes}m ${seconds}s rest`;
  }

  if (minutes > 0) {
    return `${minutes}m rest`;
  }

  return `${seconds}s rest`;
};

const WorkoutPreview = ({
  preview,
  onPreviewChange,
}: WorkoutPreviewProps) => {
  const [workingPreview, setWorkingPreview] =
    useState<GeneratedWorkoutPreview>(preview);
  const [selectedEditExercise, setSelectedEditExercise] =
    useState<SelectedEditExercise | null>(null);
  const [draftExerciseId, setDraftExerciseId] = useState<string | null>(null);
  const [draftWeight, setDraftWeight] = useState(0);

  const editExercise = (exercise: GeneratedWorkoutExercisePreview) => {
    setSelectedEditExercise(exercise);
    setDraftExerciseId(exercise.exerciseId);
    setDraftWeight(exercise.suggestedWeight ?? 0);
  };

  const closeEditSheet = () => {
    setSelectedEditExercise(null);
    setDraftExerciseId(null);
    setDraftWeight(0);
  };

  const getMovementOptions = (
    exercise: GeneratedWorkoutExercisePreview
  ): MovementOption[] => [
    {
      exerciseId: exercise.exerciseId,
      label: exercise.label,
      isCurrent: true,
    },
    ...exercise.exerciseAlternatives.filter(
      (alternative) => alternative.exerciseId !== exercise.exerciseId
    ),
  ];

  const getWeightStep = (weightUnit: SelectedEditExercise["weightUnit"]) =>
    weightUnit === "kg" ? 2.5 : 5;

  const updateDraftWeight = (amount: number) => {
    setDraftWeight((currentWeight) =>
      Math.max(0, Number((currentWeight + amount).toFixed(1)))
    );
  };

  const handleDraftWeightChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextWeight = event.currentTarget.valueAsNumber;
    setDraftWeight(Number.isFinite(nextWeight) ? Math.max(0, nextWeight) : 0);
  };

  const saveExerciseEdits = () => {
    if (!selectedEditExercise) {
      return;
    }

    const movementOptions = getMovementOptions(selectedEditExercise);
    const selectedMovement =
      movementOptions.find((option) => option.exerciseId === draftExerciseId) ??
      movementOptions[0];

    if (!selectedMovement) {
      return;
    }

    const nextPreview = {
      ...workingPreview,
      days: workingPreview.days.map((day) => ({
        ...day,
        exercises: day.exercises.map((exercise) => {
          if (exercise.id !== selectedEditExercise.id) {
            return exercise;
          }

          const hasEditableWeight =
            selectedEditExercise.suggestedWeight !== undefined &&
            selectedEditExercise.weightUnit !== undefined;
          const nextAlternatives = movementOptions
            .filter((option) => option.exerciseId !== selectedMovement.exerciseId)
            .map(({ exerciseId, label, note }) => ({
              exerciseId,
              label,
              note,
            }));

          return {
            ...exercise,
            exerciseId: selectedMovement.exerciseId,
            label: selectedMovement.label,
            suggestedWeight: hasEditableWeight ? draftWeight : exercise.suggestedWeight,
            weightUnit: hasEditableWeight ? selectedEditExercise.weightUnit : exercise.weightUnit,
            exerciseAlternatives: nextAlternatives,
          };
        }),
      })),
    };

    setWorkingPreview(nextPreview);
    onPreviewChange(nextPreview);
    closeEditSheet();
  };

  const movementOptions = selectedEditExercise
    ? getMovementOptions(selectedEditExercise)
    : [];
  const hasEditableWeight =
    selectedEditExercise?.suggestedWeight !== undefined &&
    selectedEditExercise.weightUnit !== undefined;

  return (
    <section className={clsx(styles.preview, "grid gap-5")}>
      <div className="grid gap-4">
        {workingPreview.days.map((day) => (
          <section
            key={day.id}
            className={clsx(styles.dayCard, "grid gap-4 border-panel")}
          >
            <header className="grid gap-1">
              <h2 className={styles.dayTitle}>{day.label}</h2>
              <p className="text-muted">{day.focus}</p>
            </header>

            <div className="grid gap-3">
              {day.exercises.map((exercise) => (
                <article
                  key={exercise.id}
                  className={clsx(styles.exerciseCard, "grid gap-2 border-subtle")}
                >
                  <div
                    className={clsx(
                      styles.exerciseHeading,
                      "flex gap-4 flex-wrap justify-between"
                    )}
                  >
                    <strong>{exercise.label}</strong>
                    {exercise.suggestedWeight !== undefined ? (
                      <span className={clsx(styles.weightSummary, "flex gap-2")}>
                        Start at {exercise.suggestedWeight} {exercise.weightUnit}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-muted">
                    {exercise.prescription.sets} sets • {exercise.prescription.reps} reps •{" "}
                    {formatRestLabel(exercise.prescription.restSeconds)}
                  </p>
                  {exercise.notes ? (
                    <p className="text-muted">{exercise.notes}</p>
                  ) : null}
                  {exercise.suggestedWeight !== undefined ||
                  exercise.exerciseAlternatives.length > 0 ? (
                    <Button
                      label="Edit exercise"
                      size="medium"
                      icon="edit"
                      variant="outline"
                      tone="gray"
                      onClick={() => editExercise(exercise)}
                    />
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <BottomSheet
        open={selectedEditExercise !== null}
        onClose={closeEditSheet}
        variant="full"
        eyebrow="Exercise Editor"
        title={
          selectedEditExercise ? `Customize ${selectedEditExercise.label}` : undefined
        }
        description={
          selectedEditExercise
            ? `Set a starting weight that matches your current strength. You can change this later anytime.`
            : undefined
        }
        actions={[
          
          {
            label: "Save & Return",
            tone: "primary",
            onClick: saveExerciseEdits,
          },
        ]}
      >
        {selectedEditExercise ? (
          <>
          <p className={clsx(styles.prescriptionSummary, "text-muted")}>
              {selectedEditExercise.prescription.sets} sets •{" "}
              {selectedEditExercise.prescription.reps} reps •{" "}
              {formatRestLabel(selectedEditExercise.prescription.restSeconds)}
            </p>
          <div className="grid gap-4">
            {hasEditableWeight ? (
              <section
                className={clsx(styles.editorSection, "grid gap-3 border-subtle")}
              >
                <div className={clsx(styles.headerContent)}>
                  <h3 className={styles.sectionTitle}>Starting Weight</h3>
                  <p style={{color:'var(--clr-primary-500)'}}>Recommended: <span style={{color:'var(--clr-neutral-0)'}}>{draftWeight}</span> lb</p>
                  <p>You should be able to complete {selectedEditExercise.prescription.reps} reps. </p>
                  
                </div>
                <div
                    className={clsx(styles.weightStepper)}
                  >
                  <StepButton type="decrement" size="large" onClick={() => updateDraftWeight(-getWeightStep(selectedEditExercise.weightUnit))} />
                  <div className={clsx(styles.weightInputWrapper)}>
                    <div
                      id={`starting-weight-input-${selectedEditExercise.id}`}
                      onChange={handleDraftWeightChange}
                      className={clsx(styles.weightInput)}
                    >{draftWeight}</div>
                    <span className={styles.weightUnit}>
                      {selectedEditExercise.weightUnit}
                    </span>
                  </div>
                  <StepButton type="increment" size="large" onClick={() => updateDraftWeight(+getWeightStep(selectedEditExercise.weightUnit))} />
                </div>
              </section>
            ) : null}

            {movementOptions.length > 1 ? (
              <section
                className={clsx(styles.editorSection, "grid gap-3 border-subtle")}
              >
                <div className={clsx(styles.headerContent)}>
                <h3 className={styles.sectionTitle}>Swap Exercise</h3>
                <p>Choose an alternative if equipment is unavailable or if you prefer a different variation.</p>
                </div>
                <div className="grid gap-2">
                  {movementOptions.map((option) => {
                    const isSelected = option.exerciseId === draftExerciseId;

                    return (
                      <button
                        key={`${selectedEditExercise.id}-${option.exerciseId}`}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setDraftExerciseId(option.exerciseId)}
                        className={clsx(
                          styles.movementOption,
                          "border-subtle",
                          isSelected && styles["movementOption--selected"],
                        )}
                      >
                        <div className={clsx(styles.movementHeader, "flex gap-2")}>
                          <div className={clsx(styles.movementIconWrapper)}>
                            {option.isCurrent ? (
                              <span
                                className={clsx(styles.currentIcon)}
                                aria-label="Current exercise"
                                title="Current exercise"
                              >
                                &#10003;
                              </span>
                            ) : null}
                          </div>
                          <div className={clsx(styles.movementLabel)}>
                            <div className="flex gap-2 flex-center">
                              <strong className={clsx(styles.exerciseLabel)}>{option.label}</strong>
                              {option.isCurrent ? (
                                <Pill
                                  label="Current"
                                  size="small"
                                  className={clsx(styles.activePill)}
                                />
                              ) : null}
                            </div>
                            {option.note ? <span className={clsx(styles.exerciseNote)}>{"option.note"}</span> : null}
                          </div>
                        </div>
                        <div className={clsx(styles.statusIconWrapper)}>
                          {option.isCurrent ? (
                            <span
                              className={clsx(styles.currentStatusIcon)}
                              aria-hidden="true"
                            >
                              &#10003;
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </div>
        </>

        ) : null}
      </BottomSheet>
    </section>
  );
};

export default WorkoutPreview;
