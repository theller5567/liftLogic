import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import clsx from "clsx";

import type {
  ExerciseDefinition,
  ExerciseDifficulty,
} from "../../../../shared/constants/exercise-library";
import styles from "../../styles/pages/exerciseLibrary.module.scss";
import {
  createExerciseSlug,
  formatExerciseMetadataLabel,
  getExerciseDisplayName,
  getResolvedExerciseDifficulty,
  muscleLabels,
} from "../../utils/exerciseLibraryDisplay";

type ExerciseLibraryCardProps = {
  exercise: ExerciseDefinition;
};

const getDifficultyClassName = (difficulty?: ExerciseDifficulty) => {
  const resolvedDifficulty = getResolvedExerciseDifficulty(difficulty);

  return clsx(
    styles.difficultyLevel,
    resolvedDifficulty === "beginner" && styles.difficultyBeginner,
    resolvedDifficulty === "intermediate" && styles.difficultyIntermediate,
    resolvedDifficulty === "advanced" && styles.difficultyAdvanced
  );
};

const getDifficultyCardClassName = (difficulty?: ExerciseDifficulty) => {
  const resolvedDifficulty = getResolvedExerciseDifficulty(difficulty);

  return clsx(
    resolvedDifficulty === "beginner" && styles.exerciseCardBeginner,
    resolvedDifficulty === "intermediate" && styles.exerciseCardIntermediate,
    resolvedDifficulty === "advanced" && styles.exerciseCardAdvanced
  );
};

const ExerciseLibraryCard = ({ exercise }: ExerciseLibraryCardProps) => {
  const muscleTags = [
    ...exercise.primaryMuscles,
    ...exercise.secondaryMuscles,
  ].slice(0, 4);

  return (
    <Link
      className={clsx(
        styles.exerciseCard,
        getDifficultyCardClassName(exercise.difficulty)
      )}
      state={{
        returnLabel: "Exercise library",
        returnTo: "/exercise-library",
      }}
      to={`/exercise-library/${createExerciseSlug(exercise)}`}
    >
      <strong>{getExerciseDisplayName(exercise)}</strong>
      <span className={getDifficultyClassName(exercise.difficulty)}>
        {formatExerciseMetadataLabel(getResolvedExerciseDifficulty(exercise.difficulty))}
      </span>

      <span className={styles.tagList}>
        {muscleTags.map((muscle) => (
          <span key={`${exercise.id}-${muscle}`}>{muscleLabels[muscle]}</span>
        ))}
      </span>
      <span className={styles.cardMeta}>
        {formatExerciseMetadataLabel(exercise.equipmentType)} •{" "}
        {formatExerciseMetadataLabel(exercise.movementPattern)} •{" "}
        {exercise.isCompound ? "Compound" : "Accessory"}
      </span>
      <ChevronRight className={styles.cardChevron} aria-hidden="true" size={22} />
    </Link>
  );
};

export default ExerciseLibraryCard;
