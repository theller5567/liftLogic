import { type ChangeEvent, useState } from "react";

import BottomSheet from "./BottomSheet";
import Button from "./Button";
import type { GeneratedWorkoutPreview } from "../utils/generateWorkoutPreview";
import type {
  GeneratedWorkoutExerciseAlternative,
  GeneratedWorkoutExercisePreview,
} from "../utils/generateWorkoutPreview";

type WorkoutPreviewProps = {
  preview: GeneratedWorkoutPreview;
  onPreviewChange: (preview: GeneratedWorkoutPreview) => void;
};

type SelectedWeightExercise = {
  id: string;
  label: string;
  weightUnit: NonNullable<GeneratedWorkoutExercisePreview["weightUnit"]>;
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
  const [selectedExercise, setSelectedExercise] =
    useState<GeneratedWorkoutExercisePreview | null>(null);
  const [selectedWeightExercise, setSelectedWeightExercise] =
    useState<SelectedWeightExercise | null>(null);
  const [draftWeight, setDraftWeight] = useState(0);

  const updateWorkingPreview = (
    updater: (currentPreview: GeneratedWorkoutPreview) => GeneratedWorkoutPreview
  ) => {
    setWorkingPreview((currentPreview) => {
      const nextPreview = updater(currentPreview);
      onPreviewChange(nextPreview);
      return nextPreview;
    });
  };

  const swapExercise = (
    currentExerciseSlotId: string,
    alternative: GeneratedWorkoutExerciseAlternative
  ) => {
    if (!selectedExercise) {
      return;
    }

    updateWorkingPreview((currentPreview) => ({
      ...currentPreview,
      days: currentPreview.days.map((day) => ({
        ...day,
        exercises: day.exercises.map((exercise) => {
          if (exercise.id !== currentExerciseSlotId) {
            return exercise;
          }

          return {
            ...exercise,
            exerciseId: alternative.exerciseId,
            label: alternative.label,
            suggestedWeight: undefined,
            weightUnit: undefined,
            exerciseAlternatives: [
              ...exercise.exerciseAlternatives.filter(
                (exerciseAlternative) =>
                  exerciseAlternative.exerciseId !== alternative.exerciseId
              ),
              {
                exerciseId: selectedExercise.exerciseId,
                label: selectedExercise.label,
              },
            ],
          };
        }),
      })),
    }));
    setSelectedExercise(null);
  };

  const openWeightEditor = (exercise: GeneratedWorkoutExercisePreview) => {
    if (
      exercise.suggestedWeight === undefined ||
      exercise.weightUnit === undefined
    ) {
      return;
    }

    setSelectedExercise(null);
    setSelectedWeightExercise({
      id: exercise.id,
      label: exercise.label,
      weightUnit: exercise.weightUnit,
    });
    setDraftWeight(exercise.suggestedWeight);
  };

  const editExerciseWeight = (exerciseSlotId: string, newWeight: number) => {
    updateWorkingPreview((currentPreview) => ({
      ...currentPreview,
      days: currentPreview.days.map((day) => ({
        ...day,
        exercises: day.exercises.map((exercise) => {
          if (exercise.id !== exerciseSlotId) {
            return exercise;
          }

          return {
            ...exercise,
            suggestedWeight: newWeight,
          };
        }),
      })),
    }));
  };

  const getWeightStep = (
    weightUnit: SelectedWeightExercise["weightUnit"] | undefined
  ) => (weightUnit === "kg" ? 2.5 : 5);

  const updateDraftWeight = (amount: number) => {
    setDraftWeight((currentWeight) =>
      Math.max(0, Number((currentWeight + amount).toFixed(1)))
    );
  };

  const handleDraftWeightChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextWeight = event.currentTarget.valueAsNumber;
    setDraftWeight(Number.isFinite(nextWeight) ? Math.max(0, nextWeight) : 0);
  };

  const saveDraftWeight = () => {
    if (!selectedWeightExercise) {
      return;
    }

    editExerciseWeight(selectedWeightExercise.id, draftWeight);
  };

  return (
    <section
      style={{
        width: "min(100%, 64rem)",
        display: "grid",
        gap: "1.5rem",
      }}
    >
      <div style={{ display: "grid", gap: "1rem" }}>
        {workingPreview.days.map((day) => (
          <section
            key={day.id}
            style={{
              display: "grid",
              gap: "1rem",
              padding: "1.25rem",
              borderRadius: "1rem",
              background: "hsl(var(--clr-neutral-800-b))",
              border: "1px solid hsl(var(--clr-neutral-600-b) / 0.35)",
            }}
          >
            <header style={{ display: "grid", gap: "0.25rem" }}>
              <h2 style={{ margin: 0 }}>{day.label}</h2>
              <p style={{ margin: 0, color: "hsl(var(--clr-neutral-100-b))" }}>
                {day.focus}
              </p>
            </header>

            <div style={{ display: "grid", gap: "0.75rem" }}>
              {day.exercises.map((exercise) => (
                <article
                  key={exercise.id}
                  style={{
                    display: "grid",
                    gap: "0.45rem",
                    padding: "1rem",
                    borderRadius: "0.85rem",
                    background: "hsl(var(--clr-neutral-900-b) / 0.45)",
                    border: "1px solid hsl(var(--clr-neutral-600-b) / 0.25)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "1rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <strong>{exercise.label}</strong>
                    {exercise.suggestedWeight !== undefined ? (
                      <span style={{display: 'flex', gap:'0.5rem', color: "hsl(var(--clr-primary-500-b))", fontWeight: 700 }}>
                        Start at {exercise.suggestedWeight} {exercise.weightUnit} <Button ariaLabel={`Edit starting weight for ${exercise.label}`} tone="gray" variant="iconOnly" size="small" icon="edit" onClick={() => openWeightEditor(exercise)} />
                      </span>
                    ) : null}
                  </div>
                  <p style={{ margin: 0, color: "hsl(var(--clr-neutral-100-b))" }}>
                    {exercise.prescription.sets} sets • {exercise.prescription.reps} reps •{" "}
                    {formatRestLabel(exercise.prescription.restSeconds)}
                  </p>
                  {exercise.notes ? (
                    <p style={{ margin: 0, color: "hsl(var(--clr-neutral-100-b))" }}>
                      {exercise.notes}
                    </p>
                  ) : null}
                  {exercise.exerciseAlternatives.length > 0 ? (
                    <div style={{ display: "grid", gap: "0.35rem" }}>
                      <p
                        style={{
                          margin: 0,
                          color: "hsl(var(--clr-neutral-100-b))",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                        }}
                      >
                        Need a different movement?
                      </p>
                      <Button
                        tone="gray"
                        variant="outline"
                        label="Swap exercise"
                        onClick={() => setSelectedExercise(exercise)}
                      />
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <BottomSheet
        open={selectedExercise !== null}
        onClose={() => setSelectedExercise(null)}
        variant="full"
        eyebrow="Exercise Options"
        title={selectedExercise ? `Swap ${selectedExercise.label}` : undefined}
        description={
          selectedExercise
            ? "Choose an alternative movement for this workout slot."
            : undefined
        }
        actions={[
          {
            label: "Close",
            tone: "gray",
            variant: "outline",
          },
        ]}
      >
        {selectedExercise ? (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {selectedExercise.exerciseAlternatives.map((alternative) => (
              <article
                key={`${selectedExercise.id}-${alternative.exerciseId}`}
                style={{
                  display: "grid",
                  gap: "0.45rem",
                  padding: "1rem",
                  borderRadius: "1rem",
                  background: "hsl(var(--clr-neutral-900-b) / 0.45)",
                  border: "1px solid hsl(var(--clr-neutral-600-b) / 0.25)",
                }}
              >
                <div style={{ display: "grid", gap: "0.2rem" }}>
                  <strong>{alternative.label}</strong>
                  {alternative.note ? (
                    <p
                      style={{
                        margin: 0,
                        color: "hsl(var(--clr-neutral-100-b))",
                      }}
                    >
                      {alternative.note}
                    </p>
                  ) : null}
                </div>
                <Button
                  label="Use this exercise"
                  tone="primary"
                  onClick={() => swapExercise(selectedExercise.id, alternative)}
                />
              </article>
            ))}
          </div>
        ) : null}
      </BottomSheet>

      <BottomSheet
        open={selectedWeightExercise !== null}
        onClose={() => setSelectedWeightExercise(null)}
        eyebrow="Starting Weight"
        title={
          selectedWeightExercise
            ? `Edit ${selectedWeightExercise.label}`
            : undefined
        }
        description="Adjust the suggested starting weight for this exercise."
        actions={[
          {
            label: "Cancel",
            tone: "gray",
            variant: "outline",
          },
          {
            label: "Save weight",
            tone: "primary",
            onClick: saveDraftWeight,
          },
        ]}
      >
        {selectedWeightExercise ? (
          <div style={{ display: "grid", gap: "1rem" }}>
            <div
              style={{
                display: "grid",
                gap: "0.75rem",
                padding: "1rem",
                borderRadius: "1rem",
                background: "hsl(var(--clr-neutral-900-b) / 0.45)",
                border: "1px solid hsl(var(--clr-neutral-600-b) / 0.25)",
              }}
            >
              <label
                htmlFor="starting-weight-input"
                style={{
                  color: "hsl(var(--clr-neutral-100-b))",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                }}
              >
                Starting weight
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto minmax(0, 1fr) auto",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <Button
                  ariaLabel={`Decrease starting weight for ${selectedWeightExercise.label}`}
                  tone="gray"
                  variant="iconOnly"
                  size="large"
                  icon="minus"
                  onClick={() =>
                    updateDraftWeight(-getWeightStep(selectedWeightExercise.weightUnit))
                  }
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <input
                    id="starting-weight-input"
                    type="number"
                    min="0"
                    step={getWeightStep(selectedWeightExercise.weightUnit)}
                    value={draftWeight}
                    onChange={handleDraftWeightChange}
                    style={{
                      width: "100%",
                      minWidth: 0,
                      padding: "0.65rem 0.75rem",
                      borderRadius: "0.75rem",
                      border:
                        "1px solid hsl(var(--clr-neutral-600-b) / 0.45)",
                      background: "hsl(var(--clr-neutral-800-b))",
                      color: "hsl(var(--clr-neutral-0-b))",
                      font: "inherit",
                      fontWeight: 800,
                      textAlign: "center",
                    }}
                  />
                  <span
                    style={{
                      color: "hsl(var(--clr-neutral-100-b))",
                      fontWeight: 800,
                    }}
                  >
                    {selectedWeightExercise.weightUnit}
                  </span>
                </div>
                <Button
                  ariaLabel={`Increase starting weight for ${selectedWeightExercise.label}`}
                  tone="gray"
                  variant="iconOnly"
                  size="large"
                  icon="plus"
                  onClick={() =>
                    updateDraftWeight(getWeightStep(selectedWeightExercise.weightUnit))
                  }
                />
              </div>
            </div>
          </div>
        ) : null}
      </BottomSheet>

    </section>
  );
};

export default WorkoutPreview;
