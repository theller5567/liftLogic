import type { Dispatch, SetStateAction } from "react";
import clsx from "clsx";

import type { ExerciseDefinition } from "../../../../shared/constants/exercise-library";
import type {
  GeneratedWorkoutExerciseAlternative,
  GeneratedWorkoutExercisePreview,
} from "../../utils/generateWorkoutPreview";
import { getExerciseDisplayName } from "../../utils/exerciseLibraryDisplay";
import Button from "../Button";
import Pill from "../Pill";
import styles from "../../styles/components/workoutPreview.module.scss";

type MovementOption = GeneratedWorkoutExerciseAlternative & {
  isCurrent?: boolean;
};

type SwapSource = "recommended" | "custom";

type CustomExerciseOption = {
  equipmentCompatible: boolean;
  exercise: ExerciseDefinition;
  sameMovementPattern: boolean;
  samePrimaryMuscle: boolean;
  score: number;
};

type WorkoutPreviewSwapEditorProps = {
  customExerciseOptions: CustomExerciseOption[];
  customExerciseSearch: string;
  draftExerciseId: string | null;
  isCustomSwapSaveBlocked: boolean;
  isReviewActions: boolean;
  movementOptions: MovementOption[];
  selectedCustomExercise: CustomExerciseOption | undefined;
  selectedEditExercise: GeneratedWorkoutExercisePreview;
  setCustomExerciseSearch: Dispatch<SetStateAction<string>>;
  setDraftExerciseId: Dispatch<SetStateAction<string | null>>;
  setDraftSwapSource: Dispatch<SetStateAction<SwapSource>>;
  setShowCustomExercisePicker: Dispatch<SetStateAction<boolean>>;
  showCustomExercisePicker: boolean;
};

const WorkoutPreviewSwapEditor = ({
  customExerciseOptions,
  customExerciseSearch,
  draftExerciseId,
  isCustomSwapSaveBlocked,
  isReviewActions,
  movementOptions,
  selectedCustomExercise,
  selectedEditExercise,
  setCustomExerciseSearch,
  setDraftExerciseId,
  setDraftSwapSource,
  setShowCustomExercisePicker,
  showCustomExercisePicker,
}: WorkoutPreviewSwapEditorProps) => (
  <section className={clsx(styles.editorSection, "grid gap-3 border-subtle")}>
    <div className={styles.headerContent}>
      <h3 className={styles.sectionTitle}>Swap Exercise</h3>
      <p>
        Choose an alternative if equipment is unavailable or if you prefer a
        different variation.
      </p>
    </div>
    <div className="grid gap-2">
      {movementOptions.map((option) => {
        const isSelected = option.exerciseId === draftExerciseId;

        return (
          <button
            key={`${selectedEditExercise.id}-${option.exerciseId}`}
            type="button"
            aria-pressed={isSelected}
            onClick={() => {
              setDraftExerciseId(option.exerciseId);
              setDraftSwapSource("recommended");
            }}
            className={clsx(
              styles.movementOption,
              "border-subtle",
              isSelected && styles["movementOption--selected"]
            )}
          >
            <div className={clsx(styles.movementHeader, "flex gap-2")}>
              <div className={styles.movementIconWrapper}>
                {option.isCurrent ? (
                  <span
                    className={styles.currentIcon}
                    aria-label="Current exercise"
                    title="Current exercise"
                  >
                    &#10003;
                  </span>
                ) : null}
              </div>
              <div className={styles.movementLabel}>
                <div className="flex gap-2 flex-center">
                  <strong className={styles.exerciseLabel}>{option.label}</strong>
                  {option.isCurrent ? (
                    <Pill
                      label="Current"
                      size="small"
                      className={styles.activePill}
                    />
                  ) : null}
                </div>
                {option.note ? (
                  <span className={styles.exerciseNote}>{option.note}</span>
                ) : null}
              </div>
            </div>
            <div className={styles.statusIconWrapper}>
              {option.isCurrent ? (
                <span className={styles.currentStatusIcon} aria-hidden="true">
                  &#10003;
                </span>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
    {isReviewActions ? (
      <div className={styles.customSwapArea}>
        <Button
          label={
            showCustomExercisePicker
              ? "Hide full exercise library"
              : "Choose different exercise"
          }
          tone="white"
          variant="outline"
          size="medium"
          onClick={() =>
            setShowCustomExercisePicker((currentIsVisible) => !currentIsVisible)
          }
        />
        {showCustomExercisePicker ? (
          <div className="grid gap-3">
            <p className={styles.customSwapWarning}>
              Choosing an exercise outside the recommended alternatives may
              affect your plan balance, recovery, and goal fit.
            </p>
            {isCustomSwapSaveBlocked ? (
              <p className="text-muted">
                Select a different exercise before saving this custom swap.
              </p>
            ) : null}
            <label className={styles.exerciseSearchField}>
              <span>Search exercises</span>
              <input
                type="search"
                value={customExerciseSearch}
                onChange={(event) =>
                  setCustomExerciseSearch(event.currentTarget.value)
                }
                placeholder="Search by name or alias"
              />
            </label>
            <div className="grid gap-2">
              {customExerciseOptions.map((option) => {
                const isSelected = option.exercise.id === draftExerciseId;

                return (
                  <button
                    key={`${selectedEditExercise.id}-custom-${option.exercise.id}`}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      setDraftExerciseId(option.exercise.id);
                      setDraftSwapSource("custom");
                    }}
                    className={clsx(
                      styles.movementOption,
                      "border-subtle",
                      isSelected && styles["movementOption--selected"]
                    )}
                  >
                    <div className={styles.movementLabel}>
                      <strong className={styles.exerciseLabel}>
                        {getExerciseDisplayName(option.exercise)}
                      </strong>
                      <span className={styles.exerciseNote}>
                        {[
                          option.samePrimaryMuscle
                            ? "Similar muscle target"
                            : null,
                          option.sameMovementPattern ? "Similar pattern" : null,
                          option.equipmentCompatible
                            ? "Equipment match"
                            : "Check equipment",
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </span>
                    </div>
                    {isSelected ? (
                      <span className={styles.currentStatusIcon} aria-hidden="true">
                        &#10003;
                      </span>
                    ) : null}
                  </button>
                );
              })}
              {customExerciseOptions.length === 0 ? (
                <div className="grid gap-2">
                  <p className="text-muted">No exercises match that search yet.</p>
                  {customExerciseSearch ? (
                    <Button
                      label="Clear search"
                      size="small"
                      tone="gray"
                      variant="outline"
                      onClick={() => setCustomExerciseSearch("")}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
            {selectedCustomExercise ? (
              <p className={styles.exerciseCardNote}>
                Custom swap selected outside recommended alternatives.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    ) : null}
  </section>
);

export default WorkoutPreviewSwapEditor;
