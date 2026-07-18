import { Link } from "react-router-dom";
import clsx from "clsx";
import { ClockIcon } from "lucide-react";

import { getExerciseById } from "../../../../shared/utils/exerciseLibraryAdapter";
import type { GeneratedWorkoutExercisePreview } from "../../utils/generateWorkoutPreview";
import {
  createExerciseSlugFromParts,
  muscleLabels,
} from "../../utils/exerciseLibraryDisplay";
import Button from "../Button";
import styles from "../../styles/components/workoutPreview.module.scss";
import InfoIcon from "../../assets/icons/information-button.svg?react";
import LifeLine from "../../assets/icons/047-life-line.svg?react";
import TotalSets from "../../assets/icons/total-sets.svg?react";

type ExerciseEditMode = "combined" | "weight" | "swap";

type WorkoutPreviewExerciseCardProps = {
  canChangeWeight: (exercise: GeneratedWorkoutExercisePreview) => boolean;
  canEditExercise: (exercise: GeneratedWorkoutExercisePreview) => boolean;
  canSwapExercise: (exercise: GeneratedWorkoutExercisePreview) => boolean;
  editPresentation: "combined" | "review_actions";
  exercise: GeneratedWorkoutExercisePreview;
  exerciseDetailReturnLabel: string;
  exerciseDetailReturnTo: string;
  exerciseIndex: number;
  onEditExercise: (
    exercise: GeneratedWorkoutExercisePreview,
    mode?: ExerciseEditMode
  ) => void;
};

const formatDurationLabel = (durationSeconds: number) => {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  if (minutes > 0 && seconds > 0) {
    return `${minutes}m ${seconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m`;
  }

  return `${seconds}s`;
};

const getExerciseMuscleTags = (exerciseId: string) =>
  getExerciseById(exerciseId)?.primaryMuscles.slice(0, 3).map(
    (muscleGroup) => muscleLabels[muscleGroup]
  ) ?? [];

const WorkoutPreviewExerciseCard = ({
  canChangeWeight,
  canEditExercise,
  canSwapExercise,
  editPresentation,
  exercise,
  exerciseDetailReturnLabel,
  exerciseDetailReturnTo,
  exerciseIndex,
  onEditExercise,
}: WorkoutPreviewExerciseCardProps) => {
  const isReviewActions = editPresentation === "review_actions";
  const muscleTags = getExerciseMuscleTags(exercise.exerciseId);
  const structuredEquipmentWarning = exercise.warnings?.find(
    (warning) => warning.type === "missing_equipment"
  );
  // Older generated previews stored missing-equipment warnings in notes. Keep
  // this fallback so existing saved plans still get the red warning treatment.
  const hasLegacyEquipmentWarning =
    exercise.notes?.includes("Equipment warning:") ?? false;
  const hasEquipmentWarning = Boolean(
    structuredEquipmentWarning || hasLegacyEquipmentWarning
  );

  return (
    <article
      className={clsx(
        styles.exerciseCard,
        "border-subtle",
        hasEquipmentWarning && styles["exerciseCard--warning"]
      )}
    >
      <span className={styles.exerciseIndex}>{exerciseIndex + 1}</span>
      <div className={styles.exerciseCardBody}>
        <div className={styles.exerciseCardHeader}>
          <div className={styles.exerciseTitleGroup}>
            <div className={styles.exerciseTitleContent}>
              <strong>
                {exercise.label}
                <Link
                  aria-label={`View ${exercise.label} details`}
                  className={styles.exerciseInfoLink}
                  state={{
                    returnLabel: exerciseDetailReturnLabel,
                    returnTo: exerciseDetailReturnTo,
                  }}
                  to={`/exercise-library/${createExerciseSlugFromParts(
                    exercise.exerciseId,
                    exercise.label
                  )}`}
                >
                  <InfoIcon className={styles.infoIcon} />
                </Link>
              </strong>
              {muscleTags.length > 0 ? (
                <div className={styles.muscleTags}>
                  {muscleTags.map((muscleTag) => (
                    <span key={`${exercise.id}-${muscleTag}`}>{muscleTag}</span>
                  ))}
                </div>
              ) : null}
              {exercise.detailTags?.length ? (
                <div className={styles.exerciseDetailTags}>
                  {exercise.detailTags.map((detailTag) => (
                    <span key={`${exercise.id}-${detailTag}`}>{detailTag}</span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <div className={styles.exerciseActions}>
            {exercise.suggestedWeight !== undefined ? (
              <span className={styles.weightSummary}>
                <span>Start at</span>
                <strong>
                  {exercise.suggestedWeight} {exercise.weightUnit}
                </strong>
              </span>
            ) : null}
          </div>
          {!isReviewActions && canEditExercise(exercise) ? (
            <Button
              label="Edit"
              size="small"
              icon="edit"
              variant="outline"
              tone="gray"
              className={styles.exerciseEditButton}
              onClick={() => onEditExercise(exercise)}
            />
          ) : null}
        </div>
        <dl className={styles.exerciseStats}>
          <div>
            <dt>
              <TotalSets aria-hidden="true" />
              Sets
            </dt>
            <dd>{exercise.prescription.sets} sets</dd>
          </div>
          <div>
            <dt>
              <LifeLine aria-hidden="true" />
              Reps
            </dt>
            <dd>{exercise.prescription.reps} reps</dd>
          </div>
          <div>
            <dt>
              <ClockIcon aria-hidden="true" />
              Rest
            </dt>
            <dd>{formatDurationLabel(exercise.prescription.restSeconds)}</dd>
          </div>
        </dl>
        {exercise.notes ? (
          <p
            className={clsx(
              styles.exerciseCardNote,
              hasEquipmentWarning && styles.exerciseCardWarningNote
            )}
            role={hasEquipmentWarning ? "alert" : undefined}
          >
            {exercise.notes}
          </p>
        ) : null}
        {structuredEquipmentWarning && !exercise.notes ? (
          <p
            className={clsx(
              styles.exerciseCardNote,
              styles.exerciseCardWarningNote
            )}
            role="alert"
          >
            Missing equipment: {structuredEquipmentWarning.message}
          </p>
        ) : null}
      </div>
      {isReviewActions && canEditExercise(exercise) ? (
        <div className={styles.reviewExerciseActions}>
          {canChangeWeight(exercise) ? (
            <Button
              label="Change weight"
              size="small"
              icon="edit"
              variant="outline"
              tone="white"
              className={styles.exerciseEditButton}
              onClick={() => onEditExercise(exercise, "weight")}
            />
          ) : null}
          {canSwapExercise(exercise) ? (
            <Button
              label="Swap exercise"
              size="small"
              icon="refresh"
              variant="outline"
              tone="white"
              className={styles.exerciseEditButton}
              onClick={() => onEditExercise(exercise, "swap")}
            />
          ) : null}
        </div>
      ) : null}
    </article>
  );
};

export default WorkoutPreviewExerciseCard;
