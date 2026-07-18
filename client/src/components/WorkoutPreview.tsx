import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { ClockIcon } from "lucide-react";
import {
  exerciseLibrary,
  type ExerciseDefinition,
} from "../../../shared/constants/exercise-library";
import type { EquipmentItemId } from "../../../shared/constants/equipmentCatalog";
import type { OnboardingAnswers } from "../../../shared/types/onboarding.types";
import { canPerformExercise } from "../../../shared/utils/equipmentRequirements";
import { getExerciseById } from "../../../shared/utils/exerciseLibraryAdapter";

import BottomSheet from "./BottomSheet";
import WorkoutPreviewDayTabs from "./workout-preview/WorkoutPreviewDayTabs";
import WorkoutPreviewExerciseCard from "./workout-preview/WorkoutPreviewExerciseCard";
import WorkoutPreviewSwapEditor from "./workout-preview/WorkoutPreviewSwapEditor";
import WorkoutPreviewWeightEditor from "./workout-preview/WorkoutPreviewWeightEditor";
import styles from "../styles/components/workoutPreview.module.scss";
import {
  buildExerciseReplacementPreview,
  type GeneratedWorkoutPreview,
} from "../utils/generateWorkoutPreview";
import {
  createHorizontalSlideMotion,
  pageTransition,
} from "../utils/motion";
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
  // Saved previews can contain stale alternative snapshots. Hydrate from the
  // current exercise library so newly added alternatives appear immediately.
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

const dayCardMotion = createHorizontalSlideMotion();

// Remount the preview when the parent swaps programs or regenerates exercise
// IDs. This prevents editor/day state from leaking between different previews.
const getPreviewResetKey = (preview: GeneratedWorkoutPreview) =>
  [
    preview.programId,
    preview.days
      .map((day) =>
        `${day.id}:${day.exercises
          .map((exercise) => `${exercise.id}:${exercise.exerciseId}`)
          .join(",")}`
      )
      .join("|"),
  ].join("::");

const WorkoutPreview = (props: WorkoutPreviewProps) => (
  <WorkoutPreviewContent
    key={getPreviewResetKey(props.preview)}
    {...props}
  />
);

const WorkoutPreviewContent = ({
  availableEquipment = [],
  editPresentation = "combined",
  editableExerciseIds,
  onboardingAnswers,
  preview,
  onPreviewChange,
}: WorkoutPreviewProps) => {
  const location = useLocation();
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

  const handleDayTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    dayIndex: number
  ) => {
    const lastDayIndex = workingPreview.days.length - 1;
    let nextDayIndex: number | null = null;

    if (event.key === "ArrowRight") {
      nextDayIndex = dayIndex >= lastDayIndex ? 0 : dayIndex + 1;
    } else if (event.key === "ArrowLeft") {
      nextDayIndex = dayIndex <= 0 ? lastDayIndex : dayIndex - 1;
    } else if (event.key === "Home") {
      nextDayIndex = 0;
    } else if (event.key === "End") {
      nextDayIndex = lastDayIndex;
    }

    if (nextDayIndex === null) {
      return;
    }

    event.preventDefault();
    selectDay(nextDayIndex);
    window.requestAnimationFrame(() => {
      dayTabRefs.current[nextDayIndex]?.focus();
    });
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

  const customExerciseOptions = useMemo(() => {
    if (!selectedEditExercise) {
      return [];
    }

    // Custom swaps are intentionally broader than recommended alternatives,
    // but default results still bias toward similar muscles, patterns, and
    // available equipment so users are nudged toward safer replacements.
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
          (left.exercise.displayName ?? left.exercise.name).localeCompare(
            right.exercise.displayName ?? right.exercise.name
          )
      )
      .slice(0, 30);
  }, [availableEquipment, customExerciseSearch, selectedEditExercise]);

  const saveExerciseEdits = () => {
    if (!selectedEditExercise || !onPreviewChange || isCustomSwapSaveBlocked) {
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
            // Review custom swaps rebuild the prescription instead of carrying
            // over old weight/reps blindly. Different movements may need a
            // different estimator, load, rep range, or warning note.
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
  const exerciseDetailReturnLabel = location.pathname.includes("workout-review")
    ? "Workout review"
    : location.pathname.includes("plan")
      ? "Plan"
      : "Workout";
  const exerciseDetailReturnTo = `${location.pathname}${location.search}`;
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
  const isCustomSwapSaveBlocked = Boolean(
    isSwapOnlyEditor &&
      showCustomExercisePicker &&
      selectedEditExercise &&
      draftExerciseId === selectedEditExercise.exerciseId
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
     <WorkoutPreviewDayTabs
      activeDayIndex={resolvedActiveDayIndex}
      dayTabRefs={dayTabRefs}
      days={workingPreview.days}
      onSelectDay={selectDay}
      onTabKeyDown={handleDayTabKeyDown}
    />
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
              transition={pageTransition}
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
                {activeDay.exercises.map((exercise, exerciseIndex) => (
                  <WorkoutPreviewExerciseCard
                    key={exercise.id}
                    canChangeWeight={canChangeWeight}
                    canEditExercise={canEditExercise}
                    canSwapExercise={canSwapExercise}
                    editPresentation={editPresentation}
                    exercise={exercise}
                    exerciseDetailReturnLabel={exerciseDetailReturnLabel}
                    exerciseDetailReturnTo={exerciseDetailReturnTo}
                    exerciseIndex={exerciseIndex}
                    onEditExercise={editExercise}
                  />
                ))}
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
            disabled: isCustomSwapSaveBlocked,
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
                <WorkoutPreviewWeightEditor
                  draftWeight={draftWeight}
                  getWeightStep={getWeightStep}
                  selectedEditExercise={selectedEditExercise}
                  updateDraftWeight={updateDraftWeight}
                />
              ) : null}

              {showsSwapEditor ? (
                <WorkoutPreviewSwapEditor
                  customExerciseOptions={customExerciseOptions}
                  customExerciseSearch={customExerciseSearch}
                  draftExerciseId={draftExerciseId}
                  isCustomSwapSaveBlocked={isCustomSwapSaveBlocked}
                  isReviewActions={isReviewActions}
                  movementOptions={movementOptions}
                  selectedCustomExercise={selectedCustomExercise}
                  selectedEditExercise={selectedEditExercise}
                  setCustomExerciseSearch={setCustomExerciseSearch}
                  setDraftExerciseId={setDraftExerciseId}
                  setDraftSwapSource={setDraftSwapSource}
                  setShowCustomExercisePicker={setShowCustomExercisePicker}
                  showCustomExercisePicker={showCustomExercisePicker}
                />
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
