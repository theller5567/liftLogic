import {
  exerciseLibrary,
  type ExerciseDefinition,
  type ExerciseDifficulty,
  type MuscleGroup,
} from "../../../shared/constants/exercise-library";

export const muscleLabels: Record<MuscleGroup, string> = {
  chest: "Chest",
  upper_chest: "Upper chest",
  lower_chest: "Lower chest",
  lats: "Lats",
  upper_back: "Upper back",
  rear_delts: "Rear delts",
  lateral_delts: "Side delts",
  front_delts: "Front delts",
  triceps: "Triceps",
  biceps: "Biceps",
  forearms: "Forearms",
  quadriceps: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  calves: "Calves",
  lower_back: "Lower back",
  scapular_stabilizers: "Scapula",
  abductors: "Abductors",
  adductors: "Adductors",
  core: "Core",
  hip_flexors: "Hip flexors",
  obliques: "Obliques",
  shoulders: "Shoulders",
  tibialis_anterior: "Tibialis",
  traps: "Traps",
};

export const formatExerciseMetadataLabel = (value: string) =>
  value
    .split("_")
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");

export const getExerciseDisplayName = (exercise: ExerciseDefinition) =>
  exercise.displayName ?? exercise.name;

export const createExerciseSlug = (exercise: ExerciseDefinition) => {
  const nameSlug = getExerciseDisplayName(exercise)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `${nameSlug}_${exercise.id}`;
};

export const createExerciseSlugFromParts = (
  exerciseId: string,
  fallbackLabel: string
) => {
  const exercise = exerciseLibrary.exercises.find(
    (candidate) => candidate.id === exerciseId
  );

  if (exercise) {
    return createExerciseSlug(exercise);
  }

  const nameSlug = fallbackLabel
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `${nameSlug}_${exerciseId}`;
};

export const getExerciseIdFromSlug = (exerciseSlug: string | undefined) => {
  if (!exerciseSlug) {
    return null;
  }

  return (
    [...exerciseLibrary.exercises]
      .sort((left, right) => right.id.length - left.id.length)
      .find((exercise) => exerciseSlug.endsWith(`_${exercise.id}`))?.id ?? null
  );
};

export const getExerciseSearchText = (exercise: ExerciseDefinition) =>
  [
    exercise.id,
    exercise.name,
    exercise.displayName,
    exercise.pluralDisplayName,
    exercise.verbPhrase,
    ...(exercise.aliases ?? []),
    ...(exercise.primaryMuscles ?? []),
    ...(exercise.secondaryMuscles ?? []),
    exercise.equipmentType,
    exercise.movementPattern,
    exercise.category,
    exercise.difficulty,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

export const getResolvedExerciseDifficulty = (
  difficulty?: ExerciseDifficulty
) => difficulty ?? "beginner";
