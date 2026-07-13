export { exerciseLibrary } from "../../../shared/constants/exercise-library";
export { weightEstimationRules } from "../../../shared/constants/weightEstimationRules";
export type {
  ExerciseDefinition,
  ExerciseAlternativeRef,
  ExerciseLibrary,
  EquipmentType as CatalogEquipmentType,
  MovementPattern,
  MuscleGroup,
  WorkoutExperienceLevel,
  WorkoutTemplate,
  WorkoutTemplateDay,
  WorkoutTemplateRestDay,
  WorkoutTemplateWorkoutDay,
} from "../../../shared/constants/exercise-library";
export type {
  ConfidenceLevel,
  DerivedExerciseRule,
  EquipmentType as EstimatorEquipmentType,
  ExerciseDefaultMap,
  ExerciseKey,
  ExerciseMeta,
  ExperienceLevel,
  RepMultiplierRange,
  WeightUnit,
} from "../../../shared/constants/weightEstimationRules";
export type { OnboardingAnswers } from "../../../shared/types/onboarding.types";
export {
  getDisplayNameForCanonicalKey,
  getPluralDisplayNameForCanonicalKey,
  getVerbPhraseForCanonicalKey,
  getExerciseById,
  getExercisesByCanonicalKey,
  getPrimaryExerciseForCanonicalKey,
  normalizeLibraryIdToEstimatorKey,
  getAlternativesForCanonicalKey,
} from "../../../shared/utils/exerciseLibraryAdapter";
export {
  onboardingAnchorDefinitions,
  equipmentAccessCapabilities,
  exerciseCoverageTable,
  exerciseCoverageMarkdownTable,
  getEligibleExercisesForEquipmentAccess,
  getPrimaryExerciseForAnchor,
  isExerciseAvailableForEquipmentAccess,
} from "../../../shared/utils/onboardingExerciseMapping";
export type {
  EquipmentAccess,
  ExerciseCoverageRow,
  OnboardingAnchorDefinition,
  OnboardingAnchorKey,
} from "../../../shared/utils/onboardingExerciseMapping";
