import {
  ArrowLeft,
  Check,
  ChevronRight,
  ChevronUp,
  Info,
  Minus,
  MoreVertical,
  Plus,
} from "lucide-react";
import ActiveSet from "../assets/icons/activeSet.svg?react";
import Target from "../assets/icons/target.svg?react";
import InfoData from "../assets/icons/info.svg?react";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import BottomSheet from "../components/BottomSheet";
import Button from "../components/Button";
// import DevDataInspector from "../components/dev/DevDataInspector";
import { completeWorkoutSession, updateWorkoutSession } from "../services/api";
import type {
  WorkoutExerciseLog,
  WorkoutSessionDto,
  WorkoutSetLog,
} from "../../../shared/types/workoutSession.types";
import { weightEstimationRules } from "../../../shared/constants/weightEstimationRules";
import type { WeightStepKey } from "../../../shared/types/userSettings.types";
import { normalizeLibraryIdToEstimatorKey } from "../../../shared/utils/exerciseLibraryAdapter";
import {
  getMostRecentPriorWeekExerciseLog,
  getProgressionTargetReps,
  shouldShowWeightIncreaseAdvisory,
} from "../utils/workoutAdvisory";
import { formatWorkoutDisplayLabel } from "../utils/workoutDisplayLabel";
import { useWorkoutSessionRouteContext } from "../utils/workoutSessionRouteContext";
import { getWeightStepForKey, useUserSettings } from "../utils/userSettings";
import styles from "../styles/pages/exercisePage.module.scss";

type AdvisoryAttempt = {
  nextWeight: number;
  previousWeight: number;
  setIndex: number;
};

type SetUiState = "active" | "completed" | "inactive";

const formatTimer = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

const getDefaultReps = (set: WorkoutSetLog) =>
  set.actualReps ?? getProgressionTargetReps(set.targetReps) ?? 0;

const getDefaultWeight = (exerciseLog: WorkoutExerciseLog, set: WorkoutSetLog) =>
  set.weight ?? exerciseLog.prescriptionSnapshot.suggestedWeight ?? 0;

const updateSetLog = (
  exerciseLog: WorkoutExerciseLog,
  setIndex: number,
  updater: (setLog: WorkoutSetLog) => WorkoutSetLog
) => {
  const sets = exerciseLog.sets.map((setLog, index) =>
    index === setIndex ? updater(setLog) : setLog
  );

  return {
    ...exerciseLog,
    sets,
    completed: sets.length > 0 && sets.every((setLog) => setLog.completed),
  };
};

const formatSetSummary = (setLog: WorkoutSetLog) =>
  `${setLog.weight ?? 0} ${setLog.weightUnit ?? ""} x ${setLog.actualReps ?? 0}`;

const getActiveSetIndex = (sets: WorkoutSetLog[]) =>
  sets.findIndex((setLog) => !setLog.completed);

const createExerciseInfoSlug = (label: string, exerciseId: string) => {
  const nameSlug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `${nameSlug}_${exerciseId}`;
};

const getSetUiState = (
  setLog: WorkoutSetLog,
  setIndex: number,
  activeSetIndex: number
): SetUiState => {
  if (setLog.completed) {
    return "completed";
  }

  return setIndex === activeSetIndex ? "active" : "inactive";
};

const getSetClassName = (setState: SetUiState) => {
  if (setState === "completed") {
    return styles.setComplete;
  }

  if (setState === "active") {
    return styles.setActive;
  }

  return styles.setInactive;
};

const areAllExercisesCompleted = (exerciseLogs: WorkoutExerciseLog[]) =>
  exerciseLogs.length > 0 &&
  exerciseLogs.every((exerciseLog) => exerciseLog.completed);

const getWeightStepKey = (exerciseId: string): WeightStepKey => {
  const canonicalKey = normalizeLibraryIdToEstimatorKey(exerciseId);

  if (!canonicalKey) {
    return "default";
  }

  const equipmentType = weightEstimationRules.exerciseMeta[canonicalKey].equipmentType;

  return equipmentType;
};

const WorkoutExercise = () => {
  const { exerciseIndex } = useParams();
  const navigate = useNavigate();
  const activeExerciseIndex = Number(exerciseIndex);
  const { priorSessions, session, setSession } = useWorkoutSessionRouteContext();
  const { settings } = useUserSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [advisoryAttempt, setAdvisoryAttempt] =
    useState<AdvisoryAttempt | null>(null);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const todaySetRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const showRestTimer = false;

  useEffect(() => {
    if (restSeconds === null || restSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setRestSeconds((currentSeconds) =>
        currentSeconds === null ? null : Math.max(0, currentSeconds - 1)
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, [restSeconds]);

  const activeExercise =
    Number.isInteger(activeExerciseIndex)
      ? session.exerciseLogs[activeExerciseIndex]
      : null;
  const previousExerciseLog = activeExercise
    ? getMostRecentPriorWeekExerciseLog(
        activeExercise,
        session,
        priorSessions
      )
    : undefined;
  const previousCompletedSets =
    previousExerciseLog?.sets.filter((setLog) => setLog.completed) ?? [];
  const activeSetIndex = activeExercise
    ? getActiveSetIndex(activeExercise.sets)
    : -1;
  const displaySetIndex =
    activeExercise && activeExercise.sets.length > 0
      ? activeSetIndex >= 0
        ? activeSetIndex
        : activeExercise.sets.length - 1
      : -1;
  const displaySet =
    activeExercise && displaySetIndex >= 0
      ? activeExercise.sets[displaySetIndex]
      : null;
  const previousDisplaySet = displaySet
    ? previousCompletedSets.find(
        (setLog) => setLog.setNumber === displaySet.setNumber
      )
    : undefined;
  const completedSetCount = useMemo(
    () =>
      activeExercise?.sets.filter((setLog) => setLog.completed).length ?? 0,
    [activeExercise]
  );
  const allSetsCompleted =
    Boolean(activeExercise?.sets.length) &&
    completedSetCount === activeExercise?.sets.length;
  const allExercisesCompleted = areAllExercisesCompleted(session.exerciseLogs);
  const activeExerciseStepKey = activeExercise
    ? getWeightStepKey(activeExercise.exerciseId)
    : "default";
  const activeExerciseRestSeconds =
    settings.restTimer.defaultSeconds ??
    activeExercise?.prescriptionSnapshot.restSeconds ??
    0;
  const finishExerciseLabel =
    session.status === "completed"
      ? "View workout summary"
      : allExercisesCompleted
        ? "Save and view summary"
      : allSetsCompleted
        ? "Next Exercise"
        : "Finish exercise";
  const showDevDataInspector = import.meta.env.DEV;

  useEffect(() => {
    if (activeSetIndex < 0) {
      return;
    }

    todaySetRefs.current[activeSetIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeSetIndex]);

  if (session.status === "completed") {
    return <Navigate to={`/workout/${session._id}/summary`} replace />;
  }

  const persistExerciseLogs = async (
    exerciseLogs: WorkoutExerciseLog[]
  ): Promise<WorkoutSessionDto | null> => {
    setIsSaving(true);
    setSaveError(null);
    setSession({ ...session, exerciseLogs });

    try {
      const { workoutSession } = await updateWorkoutSession(session._id, {
        exerciseLogs,
      });
      setSession(workoutSession);
      return workoutSession;
    } catch (saveDraftError) {
      setSaveError(
        saveDraftError instanceof Error
          ? saveDraftError.message
          : "We could not save this exercise yet."
      );
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const completeSessionWithLogs = async (exerciseLogs: WorkoutExerciseLog[]) => {
    setIsSaving(true);
    setSaveError(null);
    setSession({ ...session, exerciseLogs });

    try {
      const { workoutSession } = await completeWorkoutSession(session._id, {
        exerciseLogs,
      });
      setSession(workoutSession);
      setRestSeconds(null);
      navigate(`/workout/${workoutSession._id}/summary`);
      return workoutSession;
    } catch (completeError) {
      setSaveError(
        completeError instanceof Error
          ? completeError.message
          : "We could not complete this workout yet."
      );
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const applySetUpdate = (
    setIndex: number,
    updater: (setLog: WorkoutSetLog, exerciseLog: WorkoutExerciseLog) => WorkoutSetLog
  ) => {
    if (!activeExercise) {
      return;
    }

    const nextExerciseLogs = session.exerciseLogs.map((exerciseLog, index) =>
      index === activeExerciseIndex
        ? updateSetLog(exerciseLog, setIndex, (setLog) =>
            updater(setLog, exerciseLog)
          )
        : exerciseLog
    );

    setSession({ ...session, exerciseLogs: nextExerciseLogs });
  };

  const handleWeightChange = (
    setIndex: number,
    direction: "decrease" | "increase"
  ) => {
    if (!activeExercise) {
      return;
    }

    const setLog = activeExercise.sets[setIndex];
    const step = getWeightStepForKey(settings, activeExerciseStepKey);
    const previousWeight = getDefaultWeight(activeExercise, setLog);
    const nextWeight =
      direction === "increase"
        ? previousWeight + step
        : Math.max(0, previousWeight - step);

    if (
      direction === "increase" &&
      shouldShowWeightIncreaseAdvisory({
        currentSession: session,
        exerciseLog: activeExercise,
        nextWeight,
        previousWeight,
        priorSessions,
      })
    ) {
      setAdvisoryAttempt({
        nextWeight,
        previousWeight,
        setIndex,
      });
      return;
    }

    applySetUpdate(setIndex, (currentSet, currentExercise) => ({
      ...currentSet,
      weight: nextWeight,
      weightUnit: currentSet.weightUnit ?? currentExercise.prescriptionSnapshot.weightUnit,
    }));
  };

  const applyAdvisoryIncrease = () => {
    if (!advisoryAttempt) {
      return;
    }

    applySetUpdate(advisoryAttempt.setIndex, (setLog, exerciseLog) => ({
      ...setLog,
      weight: advisoryAttempt.nextWeight,
      weightUnit: setLog.weightUnit ?? exerciseLog.prescriptionSnapshot.weightUnit,
    }));
    setAdvisoryAttempt(null);
  };

  const handleRepsChange = (
    setIndex: number,
    direction: "decrease" | "increase"
  ) => {
    applySetUpdate(setIndex, (setLog) => ({
      ...setLog,
      actualReps:
        direction === "increase"
          ? getDefaultReps(setLog) + 1
          : Math.max(0, getDefaultReps(setLog) - 1),
    }));
  };

  const handleLogSet = async (setIndex: number) => {
    if (!activeExercise) {
      return;
    }

    const nextExerciseLogs = session.exerciseLogs.map((exerciseLog, index) =>
      index === activeExerciseIndex
        ? updateSetLog(exerciseLog, setIndex, (setLog) => ({
            ...setLog,
            actualReps: getDefaultReps(setLog),
            completed: true,
            weight: getDefaultWeight(exerciseLog, setLog),
            weightUnit: setLog.weightUnit ?? exerciseLog.prescriptionSnapshot.weightUnit,
          }))
        : exerciseLog
    );

    if (
      session.status !== "completed" &&
      areAllExercisesCompleted(nextExerciseLogs)
    ) {
      await completeSessionWithLogs(nextExerciseLogs);
      return;
    }

    const savedSession = await persistExerciseLogs(nextExerciseLogs);

    if (!savedSession) {
      return;
    }

    const restTime = activeExerciseRestSeconds;

    if (settings.restTimer.autoStartAfterSet && restTime) {
      setRestSeconds(restTime);
    }
  };

  const handleFinishExercise = async () => {
    if (session.status === "completed") {
      navigate(`/workout/${session._id}/summary`);
      return;
    }

    if (areAllExercisesCompleted(session.exerciseLogs)) {
      await completeSessionWithLogs(session.exerciseLogs);
      return;
    }

    const nextIncompleteIndex = session.exerciseLogs.findIndex(
      (exerciseLog, index) => index > activeExerciseIndex && !exerciseLog.completed
    );

    if (nextIncompleteIndex >= 0) {
      navigate(`/workout/${session._id}/exercise/${nextIncompleteIndex}`);
      return;
    }

    navigate(`/workout/${session._id}`);
  };

  const handleStartRestTimer = () => {
    const restTime = activeExerciseRestSeconds;

    if (restTime) {
      setRestSeconds(restTime);
    }
  };

  if (!Number.isInteger(activeExerciseIndex)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!activeExercise) {
    return (
      <section className={styles.exercisePage}>
        <p className="text-muted">We could not load this exercise.</p>
        <Button
          label="Back to workout"
          onClick={() => navigate(`/workout/${session._id}`)}
        />
      </section>
    );
  }

  return (
    <section className={styles.exercisePage}>
      {saveError ? <p className={styles.error}>{saveError}</p> : null}

      <article className={styles.exercisePanel}>
        <header className={styles.exerciseHeader}>
          <button
            type="button"
            aria-label="Back to workout"
            onClick={() => navigate(`/workout/${session._id}`)}
          >
            <ArrowLeft size={16} />
          </button>
          <div className={styles.exerciseProgress}>
            <p>
              Exercise {activeExerciseIndex + 1} of {session.exerciseLogs.length}
            </p>
            <div className={styles.progressBars}>
              {session.exerciseLogs.map((exerciseLog, index) => (
                <span
                  key={exerciseLog.slotId}
                  className={clsx(
                    exerciseLog.completed && styles.progressComplete,
                    index === activeExerciseIndex && styles.progressActive
                  )}
                />
              ))}
            </div>
          </div>
          {showDevDataInspector ? (
            <button
              type="button"
              className={styles.exerciseInfoButton}
              aria-label="Open full exercise information"
              data-tooltip="Open full exercise information"
              onClick={() =>
                navigate(
                  `/exercise-library/${createExerciseInfoSlug(
                    activeExercise.label,
                    activeExercise.exerciseId
                  )}`,
                  {
                    state: {
                      returnLabel: "Back to workout",
                      returnTo: `/workout/${session._id}/exercise/${activeExerciseIndex}`,
                    },
                  }
                )
              }
            >
              <InfoData className={styles.infoDataIcon} />
            </button>
          ) : (
            <button type="button" aria-label="Exercise options">
              <MoreVertical size={18} />
            </button>
          )}
        </header>
        <div className={styles.exerciseMeta}>
          <div className={styles.exerciseTitle}>
            <div>
              <h1>{activeExercise.label}</h1>
              <p><Target /> {formatWorkoutDisplayLabel(session.programDayLabel)}</p>
            </div>
            <span>
              {completedSetCount} / {activeExercise.sets.length} sets
            </span>
          </div>

          <div className={styles.performanceGrid}>
            <section className={styles.previousPerformance}>
              <p>Previous</p>
              {previousDisplaySet ? (
                <div className={styles.previousCard}>
                  <span>Set {previousDisplaySet.setNumber}</span>
                  <strong>
                    {previousDisplaySet.weight ??
                      previousExerciseLog?.prescriptionSnapshot.suggestedWeight ??
                      0}
                  </strong>
                  <small>
                    {previousDisplaySet.weightUnit ??
                      previousExerciseLog?.prescriptionSnapshot.weightUnit ??
                      activeExercise.prescriptionSnapshot.weightUnit}
                    {" x "}
                    {getDefaultReps(previousDisplaySet)}
                  </small>
                </div>
              ) : (
                <div className={styles.previousCard}>
                  
                  <strong>N/A</strong>
                </div>
              )}
            </section>
            <section className={styles.currentPerformance}>
              <p>Today</p>
              <div className={styles.todaySetScroller}>
                {activeExercise.sets.map((setLog, setIndex) => {
                  const setState = getSetUiState(
                    setLog,
                    setIndex,
                    activeSetIndex
                  );

                  return (
                    <div
                      key={setLog.setNumber}
                      ref={(node) => {
                        todaySetRefs.current[setIndex] = node;
                      }}
                      className={clsx(
                        styles.todaySetTile,
                        setState === "completed" && styles.todaySetComplete,
                        setState === "active" && styles.todaySetActive
                      )}
                    >
                      <span>Set {setLog.setNumber}</span>
                      <strong>{getDefaultWeight(activeExercise, setLog)}</strong>
                      <small>
                        {setLog.weightUnit ??
                          activeExercise.prescriptionSnapshot.weightUnit}
                        {" x "}
                        {getDefaultReps(setLog)}
                      </small>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
          <small>We suggest a weight you can complete {activeExercise.prescriptionSnapshot.reps} reps with good form.</small>
        </div>

        <div className={styles.setList}>
          {activeExercise.sets.map((setLog, setIndex) => {
            const setState = getSetUiState(setLog, setIndex, activeSetIndex);
            const isActiveSet = setState === "active";

            return (
              <section
                key={setLog.setNumber}
                className={clsx(styles.setPanel, getSetClassName(setState))}
              >
                <header>
                  <span className={styles.setStatusIcon}>
                    {setState === "completed" ? <Check size={18} /> : <ActiveSet />}
                  </span>
                  <div>
                    <h2>Set {setLog.setNumber}</h2>
                    <small>{setLog.targetReps} reps</small>
                  </div>
                  {setState === "completed" ? (
                    <>
                      <strong>{formatSetSummary(setLog)}</strong>
                      <ChevronRight size={22} />
                    </>
                  ) : null}
                  {setState === "active" ? (
                    <>
                      <em>Current set</em>
                      <ChevronUp size={22} />
                    </>
                  ) : null}
                  {setState === "inactive" ? <ChevronRight size={22} /> : null}
                </header>

                {isActiveSet ? (
                  <>
                    <div className={styles.stepperRow}>
                      <p>Weight</p>
                      <div className={styles.stepper}>
                        <button
                          type="button"
                          aria-label="Decrease weight"
                          onClick={() => handleWeightChange(setIndex, "decrease")}
                        >
                          <Minus size={18} />
                        </button>
                        <strong>
                          {getDefaultWeight(activeExercise, setLog)}{" "}
                          {setLog.weightUnit ??
                            activeExercise.prescriptionSnapshot.weightUnit}
                        </strong>
                        <button
                          type="button"
                          aria-label="Increase weight"
                          onClick={() => handleWeightChange(setIndex, "increase")}
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>

                    <div className={styles.stepperRow}>
                      <p>Reps</p>
                      <div className={styles.stepper}>
                        <button
                          type="button"
                          aria-label="Decrease reps"
                          onClick={() => handleRepsChange(setIndex, "decrease")}
                        >
                          <Minus size={18} />
                        </button>
                        <strong>{getDefaultReps(setLog)}</strong>
                        <button
                          type="button"
                          aria-label="Increase reps"
                          onClick={() => handleRepsChange(setIndex, "increase")}
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                    <Button
                      type="button"
                      label="Add Note or Badge"
                      className={styles.noteAction}
                      icon="edit"
                      tone="secondary"
                      variant="outline"
                    />
                      
                    <Button
                      disabled={isSaving}
                      loading={isSaving}
                      label="Log set"
                      size="large"
                      tone="primary"
                      onClick={() => handleLogSet(setIndex)}
                    />
                    
                  </>
                ) : null}
              </section>
            );
          })}
        </div>

        {showRestTimer &&<aside className={styles.restTimerCard}>
          <span>
            <Info size={18} />
          </span>
          <div>
            <strong>
              Rest Timer:{" "}
              {restSeconds !== null && restSeconds > 0
                ? formatTimer(restSeconds)
                : formatTimer(activeExerciseRestSeconds)}
            </strong>
            <p>Take your time. Quality reps over rushing.</p>
          </div>
          <Button
            label={
              restSeconds !== null && restSeconds > 0
                ? "Timer active"
                : "Start timer"
            }
            size="medium"
            tone="secondary"
            variant="outline"
            onClick={handleStartRestTimer}
          />
        </aside>}

        <Button
          className={clsx(
            styles.finishExerciseButton,
            allSetsCompleted && styles.finishExerciseReady
          )}
          disabled={isSaving}
          loading={isSaving}
          label={finishExerciseLabel}
          size="large"
          tone={allSetsCompleted ? "primary" : "black"}
          onClick={handleFinishExercise}
        />
      </article>

      <BottomSheet
        open={Boolean(advisoryAttempt)}
        onClose={() => setAdvisoryAttempt(null)}
        title="Increase anyway?"
        description="You have not completed all target sets and reps at this weight yet. Staying here can help you build a cleaner progression."
        actions={[
          {
            label: "Stay at current weight",
            tone: "primary",
            onClick: () => setAdvisoryAttempt(null),
          },
          {
            label: "Increase anyway",
            tone: "gray",
            onClick: applyAdvisoryIncrease,
          },
        ]}
      >
        <p className={styles.sheetCopy}>
          The increase is still your call. LiftLogic is only giving you a
          guardrail based on your logged history.
        </p>
      </BottomSheet>

      <BottomSheet
        open={restSeconds !== null && restSeconds > 0}
        onClose={() => setRestSeconds(null)}
        title="Resting..."
        eyebrow="Set complete"
        actions={[
          {
            label: "Cancel timer",
            tone: "gray",
            onClick: () => setRestSeconds(null),
          },
        ]}
      >
        <p className={styles.timer}>{formatTimer(restSeconds ?? 0)}</p>
      </BottomSheet>
    </section>
  );
};

export default WorkoutExercise;
