import { ArrowLeft, Check, Minus, Plus } from "lucide-react";
import ActiveSet from '../assets/icons/activeSet.svg?react';
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import Pill from "../components/Pill";

import BottomSheet from "../components/BottomSheet";
import Button from "../components/Button";
import DevDataInspector from "../components/dev/DevDataInspector";
import { updateWorkoutSession } from "../services/api";
import type {
  WorkoutExerciseLog,
  WorkoutSetLog,
} from "../../../shared/types/workoutSession.types";
import {
  getMostRecentPriorWeekExerciseLog,
  getProgressionTargetReps,
  shouldShowWeightIncreaseAdvisory,
} from "../utils/workoutAdvisory";
import { useWorkoutSessionRouteContext } from "../utils/workoutSessionRouteContext";
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

const getWeightStep = (unit?: string) => (unit === "kg" ? 2.5 : 5);

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
  `${setLog.weight ?? 0}${setLog.weightUnit ?? ""} x ${setLog.actualReps ?? 0}`;

const formatCurrentSetSummary = (
  exerciseLog: WorkoutExerciseLog,
  setLog: WorkoutSetLog
) => `${getDefaultWeight(exerciseLog, setLog)} / ${getDefaultReps(setLog)}`;

const getActiveSetIndex = (sets: WorkoutSetLog[]) =>
  sets.findIndex((setLog) => !setLog.completed);

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

const WorkoutExercise = () => {
  const { exerciseIndex } = useParams();
  const navigate = useNavigate();
  const activeExerciseIndex = Number(exerciseIndex);
  const { priorSessions, session, setSession } = useWorkoutSessionRouteContext();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [advisoryAttempt, setAdvisoryAttempt] =
    useState<AdvisoryAttempt | null>(null);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);

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
  const setStates =
    activeExercise?.sets.map((setLog, setIndex) => ({
      setNumber: setLog.setNumber,
      state: getSetUiState(setLog, setIndex, activeSetIndex),
    })) ?? [];
  const completedSetCount = useMemo(
    () =>
      activeExercise?.sets.filter((setLog) => setLog.completed).length ?? 0,
    [activeExercise]
  );
  const devDataItems = [
    {
      label: "routeParams",
      value: { activeExerciseIndex, exerciseIndex, sessionId: session._id },
    },
    { label: "session", value: session },
    { label: "activeExercise", value: activeExercise },
    { label: "activeExerciseSets", value: activeExercise?.sets ?? [] },
    { label: "previousExerciseLog", value: previousExerciseLog ?? null },
    { label: "previousCompletedSets", value: previousCompletedSets },
    { label: "priorSessions", value: priorSessions },
    {
      label: "computed",
      value: {
        activeSetIndex,
        completedSetCount,
        setStates,
        isSaving,
        restSeconds,
        advisoryAttempt,
      },
    },
  ];

  const persistExerciseLogs = async (exerciseLogs: WorkoutExerciseLog[]) => {
    setIsSaving(true);
    setSaveError(null);
    setSession({ ...session, exerciseLogs });

    try {
      const { workoutSession } = await updateWorkoutSession(session._id, {
        exerciseLogs,
      });
      setSession(workoutSession);
    } catch (saveDraftError) {
      setSaveError(
        saveDraftError instanceof Error
          ? saveDraftError.message
          : "We could not save this exercise yet."
      );
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
    const step = getWeightStep(
      setLog.weightUnit ?? activeExercise.prescriptionSnapshot.weightUnit
    );
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

    await persistExerciseLogs(nextExerciseLogs);

    const restTime = activeExercise.prescriptionSnapshot.restSeconds;

    if (restTime) {
      setRestSeconds(restTime);
    }
  };

  const handleFinishExercise = () => {
    const nextIncompleteIndex = session.exerciseLogs.findIndex(
      (exerciseLog, index) => index > activeExerciseIndex && !exerciseLog.completed
    );

    if (nextIncompleteIndex >= 0) {
      navigate(`/workout/${session._id}/exercise/${nextIncompleteIndex}`);
      return;
    }

    navigate(`/workout/${session._id}`);
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
            Back
          </button>
          <p>
            Exercise {activeExerciseIndex + 1} / {session.exerciseLogs.length}
          </p>
          <DevDataInspector
            title="Workout exercise data"
            items={devDataItems}
          />
        </header>
        <div className={styles.exerciseMeta}>
          <div className={styles.exerciseTitle}>
            <h1>{activeExercise.label}</h1>
            <span>
              {completedSetCount} / {activeExercise.sets.length} sets
            </span>
          </div>

          <p className={styles.prescription}>
            Rest between sets:{" "}
            {formatTimer(activeExercise.prescriptionSnapshot.restSeconds)}
          </p>

          <div className={styles.previousPerformance}>
            <p>Previous:</p>
            {previousCompletedSets.length > 0 ? (
              <div>
                {previousCompletedSets.map((setLog) => (
                  <Pill key={setLog.setNumber} label={formatSetSummary(setLog)} size="small" />
                ))}
              </div>
            ) : (
              <Pill label="No previous completed sets" size="small" tone="dark" />
            )}
          </div>
          <div className={styles.currentPerformance}>
            <p>Current:</p>
            {activeExercise.sets.length > 0 ? (
              <div>
                {activeExercise.sets.map((setLog, setIndex) => {
                  const setState = getSetUiState(
                    setLog,
                    setIndex,
                    activeSetIndex
                  );

                  return (
                    <Pill
                      key={setLog.setNumber}
                      size="small"
                      label={formatCurrentSetSummary(activeExercise, setLog)}
                      state={setState}
                    />
                  );
                })}
              </div>
            ) : (
              <span>No completed sets</span>
            )}
          </div>
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
                    {setState === "completed" ? <Check size={18} /> : isActiveSet ? <ActiveSet /> : null}
                  </span>
                  <h2>Set {setLog.setNumber}</h2>
                  <small>{setLog.targetReps}</small>
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
                      disabled={isSaving}
                      label="Log set"
                      size="large"
                      tone="primary"
                      onClick={() => handleLogSet(setIndex)}
                    />
                    <button
                      type="button"
                      className={styles.noteButton}
                    >
                      Add Note or Badge
                    </button>
                  </>
                ) : null}
              </section>
            );
          })}
        </div>

        <Button
          disabled={isSaving}
          label="Finish exercise"
          size="large"
          tone="black"
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
