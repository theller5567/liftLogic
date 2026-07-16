import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { ClockIcon } from "lucide-react";
import {
  exerciseLibrary,
  type ExerciseDefinition,
  type MuscleGroup,
} from "../../../shared/constants/exercise-library";
import type { EquipmentItemId } from "../../../shared/constants/equipmentCatalog";
import type { OnboardingAnswers } from "../../../shared/types/onboarding.types";
import { canPerformExercise } from "../../../shared/utils/equipmentRequirements";
import { getExerciseById } from "../../../shared/utils/exerciseLibraryAdapter";

import BottomSheet from "./BottomSheet";
import Button from "./Button";
import Pill from "./Pill";
import StepButton from "./StepButton";
import styles from "../styles/components/workoutPreview.module.scss";
import {
  buildExerciseReplacementPreview,
  type GeneratedWorkoutPreview,
} from "../utils/generateWorkoutPreview";
import { formatWorkoutDisplayLabel } from "../utils/workoutDisplayLabel";
import { getWeightStepForKey, useUserSettings } from "../utils/userSettings";
import Weights from "../assets/icons/010-weights.svg?react";
import LifeLine from "../assets/icons/047-life-line.svg?react";
import TotalSets from "../assets/icons/total-sets.svg?react";
import type {
  GeneratedWorkoutExerciseAlternative,
  GeneratedWorkoutExercisePreview,
} from "../utils/generateWorkoutPreview";

type WorkoutPreviewProps = {
  availableEquipment?: EquipmentItemId[];
  editPresentation?: "combined" | "review_actions";
  editableExerciseIds?: Set<string>;
  onboardingAnswers?: OnboardingAnswers;
  preview: GeneratedWorkoutPreview;
  onPreviewChange?: (preview: GeneratedWorkoutPreview) => void;
};

type SelectedEditExercise = GeneratedWorkoutExercisePreview;

type MovementOption = GeneratedWorkoutExerciseAlternative & {
  isCurrent?: boolean;
};

type DayNavigationDirection = 1 | -1;
type ExerciseEditMode = "combined" | "weight" | "swap";
type SwapSource = "recommended" | "custom";

const getHydratedMovementOptions = (
  exercise: GeneratedWorkoutExercisePreview
): MovementOption[] => {
  const currentLibraryExercise = getExerciseById(exercise.exerciseId);
  const libraryAlternatives =
    currentLibraryExercise?.alternatives.map((alternative) => {
      const alternativeExercise = getExerciseById(alternative.exerciseId);

      return {
        exerciseId: alternative.exerciseId,
        label:
          alternativeExercise?.displayName ??
          alternativeExercise?.name ??
          alternative.exerciseId,
        ...(alternative.note ? { note: alternative.note } : {}),
      };
    }) ?? [];
  const alternativesById = new Map(
    [...exercise.exerciseAlternatives, ...libraryAlternatives]
      .filter((alternative) => alternative.exerciseId !== exercise.exerciseId)
      .map((alternative) => [alternative.exerciseId, alternative])
  );

  return [
    {
      exerciseId: exercise.exerciseId,
      label: exercise.label,
      isCurrent: true,
    },
    ...alternativesById.values(),
  ];
};

const muscleGroupLabels: Record<MuscleGroup, string> = {
  chest: "Chest",
  upper_chest: "Upper Chest",
  lower_chest: "Lower Chest",
  lats: "Lats",
  upper_back: "Upper Back",
  rear_delts: "Rear Delts",
  lateral_delts: "Side Delts",
  front_delts: "Front Delts",
  triceps: "Triceps",
  biceps: "Biceps",
  forearms: "Forearms",
  quadriceps: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  calves: "Calves",
  lower_back: "Low Back",
  scapular_stabilizers: "Scapula",
  abductors: "Abductors",
  adductors: "Adductors",
  core: "Core",
  hip_flexors: "Hip Flexors",
  obliques: "Obliques",
  shoulders: "Shoulders",
  tibialis_anterior: "Tibialis",
  traps: "Traps",
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
    (muscleGroup) => muscleGroupLabels[muscleGroup]
  ) ?? [];

const getExerciseDisplayName = (exercise: ExerciseDefinition) =>
  exercise.displayName ?? exercise.name;

const normalizeSearchValue = (value: string) => value.trim().toLowerCase();

const hasSharedPrimaryMuscle = (
  source: ExerciseDefinition,
  candidate: ExerciseDefinition
) =>
  source.primaryMuscles.some((muscleGroup) =>
    candidate.primaryMuscles.includes(muscleGroup)
  );

const WORKOUT_SET_EXECUTION_SECONDS = 45;

const getRepValues = (reps: string) => reps.match(/\d+/g)?.map(Number) ?? [];

const formatWorkoutRepRange = (
  exercises: GeneratedWorkoutExercisePreview[]
) => {
  const repValues = exercises.flatMap((exercise) =>
    getRepValues(exercise.prescription.reps)
  );

  if (repValues.length === 0) {
    return "N/A";
  }

  const minReps = Math.min(...repValues);
  const maxReps = Math.max(...repValues);

  return minReps === maxReps ? `${minReps}` : `${minReps}-${maxReps}`;
};

const formatEstimatedWorkoutTime = (
  exercises: GeneratedWorkoutExercisePreview[]
) => {
  const totalSeconds = exercises.reduce((total, exercise) => {
    const { sets, restSeconds } = exercise.prescription;
    const executionTime = sets * WORKOUT_SET_EXECUTION_SECONDS;
    const restTime = Math.max(sets - 1, 0) * restSeconds;

    return total + executionTime + restTime;
  }, 0);
  const roundedMinutes = Math.max(1, Math.round(totalSeconds / 60));

  return `${roundedMinutes} min`;
};

const dayCardMotion = {
  initial: (direction: DayNavigationDirection) => ({
    opacity: 0,
    x: direction > 0 ? 48 : -48,
  }),
  animate: { opacity: 1, x: 0 },
  exit: (direction: DayNavigationDirection) => ({
    opacity: 0,
    x: direction > 0 ? -48 : 48,
  }),
};

const WorkoutPreview = ({
  availableEquipment = [],
  editPresentation = "combined",
  editableExerciseIds,
  onboardingAnswers,
  preview,
  onPreviewChange,
}: WorkoutPreviewProps) => {
  const { settings } = useUserSettings();
  const [workingPreview, setWorkingPreview] =
    useState<GeneratedWorkoutPreview>(preview);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [dayNavigationDirection, setDayNavigationDirection] =
    useState<DayNavigationDirection>(1);
  const [selectedEditExercise, setSelectedEditExercise] =
    useState<SelectedEditExercise | null>(null);
  const [activeEditMode, setActiveEditMode] = useState<ExerciseEditMode>("combined");
  const [draftExerciseId, setDraftExerciseId] = useState<string | null>(null);
  const [draftSwapSource, setDraftSwapSource] =
    useState<SwapSource>("recommended");
  const [draftWeight, setDraftWeight] = useState(0);
  const [showCustomExercisePicker, setShowCustomExercisePicker] = useState(false);
  const [customExerciseSearch, setCustomExerciseSearch] = useState("");
  const dayTabRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  const editExercise = (
    exercise: GeneratedWorkoutExercisePreview,
    mode: ExerciseEditMode = "combined"
  ) => {
    const hasRecommendedAlternatives =
      getHydratedMovementOptions(exercise).length > 1;

    setSelectedEditExercise(exercise);
    setActiveEditMode(mode);
    setDraftExerciseId(exercise.exerciseId);
    setDraftSwapSource("recommended");
    setDraftWeight(exercise.suggestedWeight ?? 0);
    setShowCustomExercisePicker(mode === "swap" && !hasRecommendedAlternatives);
    setCustomExerciseSearch("");
  };

  const selectDay = (dayIndex: number) => {
    if (dayIndex === activeDayIndex) {
      return;
    }

    setDayNavigationDirection(dayIndex > activeDayIndex ? 1 : -1);
    setActiveDayIndex(dayIndex);
  };

  const closeEditSheet = () => {
    setSelectedEditExercise(null);
    setActiveEditMode("combined");
    setDraftExerciseId(null);
    setDraftSwapSource("recommended");
    setDraftWeight(0);
    setShowCustomExercisePicker(false);
    setCustomExerciseSearch("");
  };

  const getMovementOptions = (
    exercise: GeneratedWorkoutExercisePreview
  ): MovementOption[] => getHydratedMovementOptions(exercise);

  const getWeightStep = () => getWeightStepForKey(settings, "default");

  const isEditableExercise = (exercise: GeneratedWorkoutExercisePreview) =>
    Boolean(onPreviewChange && (!editableExerciseIds || editableExerciseIds.has(exercise.id)));

  const canChangeWeight = (exercise: GeneratedWorkoutExercisePreview) =>
    isEditableExercise(exercise) && exercise.suggestedWeight !== undefined;

  const canSwapExercise = (exercise: GeneratedWorkoutExercisePreview) =>
    Boolean(
      isEditableExercise(exercise) &&
        (getMovementOptions(exercise).length > 1 || onboardingAnswers)
    );

  const canEditExercise = (exercise: GeneratedWorkoutExercisePreview) =>
    editPresentation === "review_actions"
      ? canChangeWeight(exercise) || canSwapExercise(exercise)
      : Boolean(
          isEditableExercise(exercise) &&
            (exercise.suggestedWeight !== undefined ||
              getMovementOptions(exercise).length > 1)
        );

  const updateDraftWeight = (amount: number) => {
    setDraftWeight((currentWeight) =>
      Math.max(0, Number((currentWeight + amount).toFixed(1)))
    );
  };

  const handleDraftWeightChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextWeight = event.currentTarget.valueAsNumber;
    setDraftWeight(Number.isFinite(nextWeight) ? Math.max(0, nextWeight) : 0);
  };

  const customExerciseOptions = useMemo(() => {
    if (!selectedEditExercise) {
      return [];
    }

    const sourceExercise = getExerciseById(selectedEditExercise.exerciseId);
    const searchValue = normalizeSearchValue(customExerciseSearch);

    const scoredOptions = exerciseLibrary.exercises
      .filter((exercise) => exercise.id !== selectedEditExercise.exerciseId)
      .filter((exercise) => {
        if (!searchValue) {
          return true;
        }

        const searchableText = [
          exercise.name,
          exercise.displayName,
          ...(exercise.aliases ?? []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(searchValue);
      })
      .map((exercise) => {
        const samePrimaryMuscle = sourceExercise
          ? hasSharedPrimaryMuscle(sourceExercise, exercise)
          : false;
        const sameMovementPattern =
          sourceExercise?.movementPattern === exercise.movementPattern;
        const equipmentCompatible =
          availableEquipment.length === 0 ||
          canPerformExercise(exercise.id, availableEquipment);
        const score =
          (samePrimaryMuscle ? 60 : 0) +
          (sameMovementPattern ? 40 : 0) +
          (equipmentCompatible ? 25 : 0) +
          (searchValue ? 100 : 0);

        return {
          exercise,
          equipmentCompatible,
          sameMovementPattern,
          samePrimaryMuscle,
          score,
        };
      });
    const hasTargetedOptions = scoredOptions.some(
      (option) => option.samePrimaryMuscle || option.sameMovementPattern
    );

    return scoredOptions
      .filter((option) => {
        if (searchValue) {
          return true;
        }

        return (
          option.samePrimaryMuscle ||
          option.sameMovementPattern ||
          (!hasTargetedOptions && option.equipmentCompatible)
        );
      })
      .sort(
        (left, right) =>
          right.score - left.score ||
          getExerciseDisplayName(left.exercise).localeCompare(
            getExerciseDisplayName(right.exercise)
          )
      )
      .slice(0, 30);
  }, [availableEquipment, customExerciseSearch, selectedEditExercise]);

  const saveExerciseEdits = () => {
    if (!selectedEditExercise || !onPreviewChange) {
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

          if (activeEditMode === "weight") {
            return {
              ...exercise,
              suggestedWeight: draftWeight,
            };
          }

          if (
            editPresentation === "review_actions" &&
            activeEditMode === "swap" &&
            onboardingAnswers &&
            draftExerciseId &&
            draftExerciseId !== selectedEditExercise.exerciseId
          ) {
            return buildExerciseReplacementPreview({
              answers: onboardingAnswers,
              currentExercise: selectedEditExercise,
              goal: workingPreview.goal,
              nextExerciseId: draftExerciseId,
              swapSource: draftSwapSource,
            });
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
  const resolvedActiveDayIndex = Math.min(
    activeDayIndex,
    Math.max(workingPreview.days.length - 1, 0)
  );
  const activeDay =
    workingPreview.days[resolvedActiveDayIndex] ??
    workingPreview.days[0];
  const isReviewActions = editPresentation === "review_actions";
  const isWeightOnlyEditor = activeEditMode === "weight";
  const isSwapOnlyEditor = activeEditMode === "swap";
  const showsWeightEditor =
    selectedEditExercise !== null &&
    hasEditableWeight &&
    (!isReviewActions || isWeightOnlyEditor);
  const showsSwapEditor =
    selectedEditExercise !== null &&
    (!isReviewActions || isSwapOnlyEditor) &&
    (movementOptions.length > 1 || isReviewActions);
  const selectedCustomExercise = customExerciseOptions.find(
    (option) => option.exercise.id === draftExerciseId
  );
  const estimatedTime = activeDay
    ? formatEstimatedWorkoutTime(activeDay.exercises)
    : "";
  const repRange = activeDay ? formatWorkoutRepRange(activeDay.exercises) : "";

  useEffect(() => {
    dayTabRefs.current[resolvedActiveDayIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [resolvedActiveDayIndex]);

  return (
    <>
     <div className={styles.dayTabsContainer}>
      <div className={styles.dayTabs} role="tablist" aria-label="Workout days">
        {workingPreview.days.map((day, dayIndex) => {
          const isActive = dayIndex === resolvedActiveDayIndex;

          return (
            <button
              key={day.id}
              ref={(node) => {
                dayTabRefs.current[dayIndex] = node;
              }}
              id={`workout-day-tab-${day.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`workout-day-panel-${day.id}`}
              className={clsx(styles.dayTab, isActive && styles.active)}
              onClick={() => selectDay(dayIndex)}
            >
              <span className={styles.dayTabLabel}>
                {formatWorkoutDisplayLabel(day.label)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
    <section className={clsx(styles.preview, "grid gap-5")}>
      <div className={styles.dayPanelViewport}>
        <AnimatePresence mode="wait" initial={false}>
          {activeDay ? (
            <motion.section
              key={activeDay.id}
              id={`workout-day-panel-${activeDay.id}`}
              role="tabpanel"
              aria-labelledby={`workout-day-tab-${activeDay.id}`}
              variants={dayCardMotion}
              custom={dayNavigationDirection}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.24, ease: "easeOut" }}
              className={clsx(styles.dayCard, "grid gap-4 border-panel")}
            >
              <header className="grid gap-1">
                <div className="flex flex-column gap-1">
                  <h2 className={styles.dayTitle}>
                    <span>Workout</span>
                    {formatWorkoutDisplayLabel(activeDay.label)}
                  </h2>
                  <p className={styles.dayFocus}>{activeDay.focus}</p>
                </div>
              </header>

              <ul className={styles.workoutSummary}>
              <li className={styles.totalExercises}>
                <Weights className={styles.summaryIcons} aria-hidden="true" />
                  <span className={styles.summaryLabel}>Total Exercises</span>
                  <span className={styles.summaryValue}>{activeDay.exercises.length}</span>
                </li>
                <li className={styles.repRange}>
                <LifeLine className={styles.summaryIcons} aria-hidden="true" />
                  <span className={styles.summaryLabel}>Rep Range</span>
                  <span className={styles.summaryValue}>{repRange}</span>
                </li>
                <li className={styles.totalSets}>
                  <TotalSets className={styles.summaryIcons} aria-hidden="true" />
                  <span className={styles.summaryLabel}>Total Sets</span>
                  <span className={styles.summaryValue}>{activeDay.exercises.reduce((acc, exercise) => acc + exercise.prescription.sets, 0)}</span>
                </li>
                
                <li className={styles.estimatedTime}>
                  <ClockIcon className={styles.summaryIcons} aria-hidden="true" />
                  <span className={styles.summaryLabel}>Estimated Time</span>
                  <span className={styles.summaryValue}>{estimatedTime}</span>
                </li>
              </ul>

              <div className="grid gap-5">
                {activeDay.exercises.map((exercise, exerciseIndex) => {
                  const muscleTags = getExerciseMuscleTags(exercise.exerciseId);
                  const hasEquipmentWarning =
                    exercise.notes?.includes("Equipment warning:") ?? false;

                  return (
                  <article
                    key={exercise.id}
                    className={clsx(
                      styles.exerciseCard,
                      "border-subtle",
                      hasEquipmentWarning && styles["exerciseCard--warning"]
                    )}
                  >
                    <span className={styles.exerciseIndex}>
                      {exerciseIndex + 1}
                    </span>
                    <div className={styles.exerciseCardBody}>
                      <div className={styles.exerciseCardHeader}>
                        <div className={styles.exerciseTitleGroup}>
                        <div className={styles.exerciseTitleContent}>
                          <strong>{exercise.label}</strong>
                          {muscleTags.length > 0 ? (
                            <div className={styles.muscleTags}>
                              {muscleTags.map((muscleTag) => (
                                <span key={`${exercise.id}-${muscleTag}`}>
                                  {muscleTag}
                                </span>
                              ))}
                            </div>
                          ) : null}
                          {exercise.detailTags?.length ? (
                            <div className={styles.exerciseDetailTags}>
                              {exercise.detailTags.map((detailTag) => (
                                <span key={`${exercise.id}-${detailTag}`}>
                                  {detailTag}
                                </span>
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
                              onClick={() => editExercise(exercise)}
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
                        >
                          {exercise.notes}
                        </p>
                      ) : null}
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
                              onClick={() => editExercise(exercise, "weight")}
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
                              onClick={() => editExercise(exercise, "swap")}
                            />
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
                })}
              </div>
            </motion.section>
          ) : null}
        </AnimatePresence>
      </div>

      <BottomSheet
        open={selectedEditExercise !== null}
        onClose={closeEditSheet}
        variant="full"
        eyebrow="Exercise Editor"
        title={
          selectedEditExercise
            ? activeEditMode === "weight"
              ? `Change ${selectedEditExercise.label} weight`
              : activeEditMode === "swap"
                ? `Swap ${selectedEditExercise.label}`
                : `Customize ${selectedEditExercise.label}`
            : undefined
        }
        description={
          selectedEditExercise
            ? activeEditMode === "swap"
              ? "Choose a recommended alternative or carefully select another exercise from the library."
              : `Set a starting weight that matches your current strength. You can change this later anytime.`
            : undefined
        }
        actions={[
          
          {
            label: activeEditMode === "weight" ? "Save weight" : "Save & Return",
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
            {showsWeightEditor ? (
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
                  <StepButton type="decrement" size="large" onClick={() => updateDraftWeight(-getWeightStep())} />
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
                  <StepButton type="increment" size="large" onClick={() => updateDraftWeight(+getWeightStep())} />
                </div>
              </section>
            ) : null}

            {showsSwapEditor ? (
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
                        onClick={() => {
                          setDraftExerciseId(option.exerciseId);
                          setDraftSwapSource("recommended");
                        }}
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
                            {option.note ? <span className={clsx(styles.exerciseNote)}>{option.note}</span> : null}
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
                      size="small"
                      onClick={() =>
                        setShowCustomExercisePicker(
                          (currentIsVisible) => !currentIsVisible
                        )
                      }
                    />
                    {showCustomExercisePicker ? (
                      <div className="grid gap-3">
                        <p className={styles.customSwapWarning}>
                          Choosing an exercise outside the recommended alternatives may affect your plan balance, recovery, and goal fit.
                        </p>
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
                            const isSelected =
                              option.exercise.id === draftExerciseId;

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
                                  isSelected &&
                                    styles["movementOption--selected"],
                                )}
                              >
                                <div className={clsx(styles.movementLabel)}>
                                  <strong className={clsx(styles.exerciseLabel)}>
                                    {getExerciseDisplayName(option.exercise)}
                                  </strong>
                                  <span className={clsx(styles.exerciseNote)}>
                                    {[
                                      option.samePrimaryMuscle
                                        ? "Similar muscle target"
                                        : null,
                                      option.sameMovementPattern
                                        ? "Similar pattern"
                                        : null,
                                      option.equipmentCompatible
                                        ? "Equipment match"
                                        : "Check equipment",
                                    ]
                                      .filter(Boolean)
                                      .join(" • ")}
                                  </span>
                                </div>
                                {isSelected ? (
                                  <span
                                    className={clsx(styles.currentStatusIcon)}
                                    aria-hidden="true"
                                  >
                                    &#10003;
                                  </span>
                                ) : null}
                              </button>
                            );
                          })}
                          {customExerciseOptions.length === 0 ? (
                            <p className="text-muted">
                              No exercises match that search yet.
                            </p>
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
            ) : null}
          </div>
        </>

        ) : null}
      </BottomSheet>
    </section>
    </>
  );
};

export default WorkoutPreview;
