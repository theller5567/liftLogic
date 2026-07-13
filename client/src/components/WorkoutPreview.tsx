import { type ChangeEvent, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { ClockIcon } from "lucide-react";
import type { MuscleGroup } from "../../../shared/constants/exercise-library";
import { getExerciseById } from "../../../shared/utils/exerciseLibraryAdapter";

import BottomSheet from "./BottomSheet";
import Button from "./Button";
import Pill from "./Pill";
import StepButton from "./StepButton";
import styles from "../styles/components/workoutPreview.module.scss";
import type { GeneratedWorkoutPreview } from "../utils/generateWorkoutPreview";
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
  editableExerciseIds?: Set<string>;
  preview: GeneratedWorkoutPreview;
  onPreviewChange?: (preview: GeneratedWorkoutPreview) => void;
};

type SelectedEditExercise = GeneratedWorkoutExercisePreview;

type MovementOption = GeneratedWorkoutExerciseAlternative & {
  isCurrent?: boolean;
};

type DayNavigationDirection = 1 | -1;

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
  editableExerciseIds,
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
  const [draftExerciseId, setDraftExerciseId] = useState<string | null>(null);
  const [draftWeight, setDraftWeight] = useState(0);
  const dayTabRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  const editExercise = (exercise: GeneratedWorkoutExercisePreview) => {
    setSelectedEditExercise(exercise);
    setDraftExerciseId(exercise.exerciseId);
    setDraftWeight(exercise.suggestedWeight ?? 0);
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

  const getWeightStep = () => getWeightStepForKey(settings, "default");

  const canEditExercise = (exercise: GeneratedWorkoutExercisePreview) =>
    Boolean(
      onPreviewChange &&
        (!editableExerciseIds || editableExerciseIds.has(exercise.id)) &&
        (exercise.suggestedWeight !== undefined ||
          exercise.exerciseAlternatives.length > 0)
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

                  return (
                  <article
                    key={exercise.id}
                    className={clsx(styles.exerciseCard, "border-subtle")}
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
                        {canEditExercise(exercise) ? (
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
                        <p className={styles.exerciseCardNote}>{exercise.notes}</p>
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
