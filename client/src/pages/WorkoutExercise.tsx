import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import BottomSheet from "../components/BottomSheet";
import Button from "../components/Button";
import WorkoutExerciseHeader from "../components/workout-session/WorkoutExerciseHeader";
import WorkoutExercisePerformance from "../components/workout-session/WorkoutExercisePerformance";
import ProgressionRecommendationCard from "../components/workout-session/ProgressionRecommendationCard";
import WorkoutRestTimerCard from "../components/workout-session/WorkoutRestTimerCard";
import WorkoutSetPanel from "../components/workout-session/WorkoutSetPanel";
// import DevDataInspector from "../components/dev/DevDataInspector";
import { completeWorkoutSession, updateWorkoutSession } from "../services/api";
import type {
  WorkoutBadgeId,
  WorkoutExerciseLog,
  WorkoutSessionDto,
  WorkoutSetLog,
} from "../../../shared/types/workoutSession.types";
import { workoutBadgeOptions } from "../../../shared/constants/workout-badges";
import { weightEstimationRules } from "../../../shared/constants/weightEstimationRules";
import type { WeightStepKey } from "../../../shared/types/userSettings.types";
import type {
  CurrentProgramScope,
  ExerciseHistoryScopeOptions,
} from "../../../shared/utils/workoutSessionScope";
import { normalizeLibraryIdToEstimatorKey } from "../../../shared/utils/exerciseLibraryAdapter";
import {
  getProgressiveOverloadRecommendation,
  getMostRecentPriorWeekExerciseLog,
  shouldShowWeightIncreaseAdvisory,
} from "../utils/workoutAdvisory";
import {
  buildUserMessages,
  getUserMessagesForSurface,
  type UserMessage,
} from "../utils/userMessages";
import { useWorkoutSessionRouteContext } from "../utils/workoutSessionRouteContext";
import { getWeightStepForKey, useUserSettings } from "../utils/userSettings";
import { createExerciseSlugFromParts } from "../utils/exerciseLibraryDisplay";
import {
  formatTimer,
  getActiveSetIndex,
  getDefaultReps,
  getDefaultWeight,
} from "../utils/workoutSetFormatting";
import { areAllWorkoutExercisesCompleted } from "../utils/workoutSessionStats";
import styles from "../styles/pages/exercisePage.module.scss";

type AdvisoryAttempt = {
  nextWeight: number;
  previousWeight: number;
  setIndex: number;
};

type SetUiState = "active" | "completed" | "inactive";

type NoteBadgeDraft = {
  badgeIds: WorkoutBadgeId[];
  exerciseNotes: string;
};

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

const getExerciseMessageClassName = (message: UserMessage) =>
  clsx(
    styles.exerciseMessage,
    message.severity === "warning" && styles.exerciseMessageWarning,
    message.severity === "danger" && styles.exerciseMessageDanger
  );

const getWeightStepKey = (exerciseId: string): WeightStepKey => {
  const canonicalKey = normalizeLibraryIdToEstimatorKey(exerciseId);

  if (!canonicalKey) {
    return "default";
  }

  const equipmentType = weightEstimationRules.exerciseMeta[canonicalKey].equipmentType;

  return equipmentType;
};

const formatTimerExerciseTarget = (exerciseLog: WorkoutExerciseLog) => {
  const { reps, sets, suggestedWeight, weightUnit } =
    exerciseLog.prescriptionSnapshot;
  const load =
    suggestedWeight !== undefined ? ` • ${suggestedWeight} ${weightUnit ?? "lb"}` : "";

  return `${sets} sets • ${reps} reps${load}`;
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
  const [noteBadgeDraft, setNoteBadgeDraft] = useState<NoteBadgeDraft | null>(
    null
  );
  const [
    dismissedProgressionExerciseIndex,
    setDismissedProgressionExerciseIndex,
  ] = useState<number | null>(null);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const todaySetRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const showRestTimer = false;
  const currentProgramScope = useMemo<CurrentProgramScope>(
    () => ({
      activeProgramHistoryId: session.programHistoryId,
      programId: session.programId,
      programVersion: session.programVersion,
      workoutPlanId: session.workoutPlanId,
    }),
    [
      session.programHistoryId,
      session.programId,
      session.programVersion,
      session.workoutPlanId,
    ]
  );
  const exerciseHistoryScope = useMemo<ExerciseHistoryScopeOptions>(
    () => ({
      currentProgramScope,
      includePreviousPrograms:
        settings.exerciseHistory.includePreviousPrograms,
      resetCutoffs: settings.exerciseHistory.resetCutoffs,
    }),
    [
      currentProgramScope,
      settings.exerciseHistory.includePreviousPrograms,
      settings.exerciseHistory.resetCutoffs,
    ]
  );

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
        priorSessions,
        exerciseHistoryScope
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
  const allExercisesCompleted = areAllWorkoutExercisesCompleted(
    session.exerciseLogs
  );
  const activeExerciseStepKey = activeExercise
    ? getWeightStepKey(activeExercise.exerciseId)
    : "default";
  const activeExerciseWeightStep = getWeightStepForKey(
    settings,
    activeExerciseStepKey
  );
  const progressionRecommendation = useMemo(
    () =>
      activeExercise
        ? getProgressiveOverloadRecommendation({
            currentSession: session,
            exerciseLog: activeExercise,
            exerciseHistoryScope,
            priorSessions,
            weightStep: activeExerciseWeightStep,
          })
        : null,
    [
      activeExercise,
      activeExerciseWeightStep,
      exerciseHistoryScope,
      priorSessions,
      session,
    ]
  );
  const exerciseMessages = useMemo(
    () =>
      activeExercise
        ? getUserMessagesForSurface(
            buildUserMessages({
              activeExerciseId: activeExercise.exerciseId,
              exerciseHistoryScope,
              messagePreferences: settings.messages,
              sessions: [...priorSessions, session],
            }),
            "workout_exercise"
          )
        : [],
    [activeExercise, exerciseHistoryScope, priorSessions, session, settings.messages]
  );
  const showProgressionRecommendation =
    Boolean(progressionRecommendation) &&
    progressionRecommendation?.state !== "no_history" &&
    !allSetsCompleted &&
    dismissedProgressionExerciseIndex !== activeExerciseIndex;
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
  const advisoryWeightUnit =
    activeExercise?.prescriptionSnapshot.weightUnit ?? "lb";
  const advisoryRequestedIncrease = advisoryAttempt
    ? `${advisoryAttempt.previousWeight} ${advisoryWeightUnit} to ${advisoryAttempt.nextWeight} ${advisoryWeightUnit}`
    : null;
  const timerNextExerciseIndex = useMemo(() => {
    const nextIncompleteIndex = session.exerciseLogs.findIndex(
      (exerciseLog, index) => index > activeExerciseIndex && !exerciseLog.completed
    );

    if (nextIncompleteIndex >= 0) {
      return nextIncompleteIndex;
    }

    const nextSequentialIndex = activeExerciseIndex + 1;

    return nextSequentialIndex < session.exerciseLogs.length
      ? nextSequentialIndex
      : -1;
  }, [activeExerciseIndex, session.exerciseLogs]);
  const timerNextExercise =
    timerNextExerciseIndex >= 0
      ? session.exerciseLogs[timerNextExerciseIndex]
      : null;
  const isRestTimerComplete = restSeconds !== null && restSeconds <= 0;

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
      navigate(`/workout/${workoutSession._id}/summary`, {
        state: { showWorkoutNotes: true },
      });
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
        exerciseHistoryScope,
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

  const applyProgressionRecommendation = async () => {
    if (
      !activeExercise ||
      !progressionRecommendation?.canApplyWeight ||
      progressionRecommendation.recommendedWeight === undefined
    ) {
      return;
    }

    const nextExerciseLogs = session.exerciseLogs.map((exerciseLog, index) => {
      if (index !== activeExerciseIndex) {
        return exerciseLog;
      }

      return {
        ...exerciseLog,
        sets: exerciseLog.sets.map((setLog) =>
          setLog.completed
            ? setLog
            : {
                ...setLog,
                weight: progressionRecommendation.recommendedWeight,
                weightUnit:
                  progressionRecommendation.weightUnit ??
                  setLog.weightUnit ??
                  exerciseLog.prescriptionSnapshot.weightUnit,
              }
        ),
      };
    });

    const savedSession = await persistExerciseLogs(nextExerciseLogs);

    if (savedSession) {
      setDismissedProgressionExerciseIndex(activeExerciseIndex);
    }
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
      areAllWorkoutExercisesCompleted(nextExerciseLogs)
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

    if (areAllWorkoutExercisesCompleted(session.exerciseLogs)) {
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

  const handleAddRestTime = () => {
    setRestSeconds((currentSeconds) => (currentSeconds ?? 0) + 30);
  };

  const handleSkipRest = () => {
    setRestSeconds(null);

    if (timerNextExerciseIndex >= 0) {
      navigate(`/workout/${session._id}/exercise/${timerNextExerciseIndex}`);
    }
  };

  const openNoteBadgeSheet = () => {
    if (!activeExercise) {
      return;
    }

    setNoteBadgeDraft({
      badgeIds: activeExercise.badgeIds,
      exerciseNotes: activeExercise.notes ?? "",
    });
  };

  const toggleDraftBadge = (badgeId: WorkoutBadgeId) => {
    setNoteBadgeDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft;
      }

      return {
        ...currentDraft,
        badgeIds: currentDraft.badgeIds.includes(badgeId)
          ? currentDraft.badgeIds.filter(
              (currentBadgeId) => currentBadgeId !== badgeId
            )
          : [...currentDraft.badgeIds, badgeId],
      };
    });
  };

  const saveNoteBadgeDraft = async () => {
    if (!activeExercise || !noteBadgeDraft) {
      return;
    }

    const nextExerciseLogs = session.exerciseLogs.map((exerciseLog, index) => {
      if (index !== activeExerciseIndex) {
        return exerciseLog;
      }

      return {
        ...exerciseLog,
        badgeIds: noteBadgeDraft.badgeIds,
        notes: noteBadgeDraft.exerciseNotes.trim() || undefined,
      };
    });

    const savedSession = await persistExerciseLogs(nextExerciseLogs);

    if (savedSession) {
      setNoteBadgeDraft(null);
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
        <WorkoutExerciseHeader
          activeExerciseIndex={activeExerciseIndex}
          exerciseLogs={session.exerciseLogs}
          onBack={() => navigate(`/workout/${session._id}`)}
          onOpenExerciseInfo={() =>
            navigate(
              `/exercise-library/${createExerciseSlugFromParts(
                activeExercise.exerciseId,
                activeExercise.label
              )}`,
              {
                state: {
                  returnLabel: "Back to workout",
                  returnTo: `/workout/${session._id}/exercise/${activeExerciseIndex}`,
                },
              }
            )
          }
          showExerciseInfo={showDevDataInspector}
        />
        <WorkoutExercisePerformance
          activeExercise={activeExercise}
          activeSetIndex={activeSetIndex}
          completedSetCount={completedSetCount}
          previousDisplaySet={previousDisplaySet}
          previousExerciseLog={previousExerciseLog}
          programDayLabel={session.programDayLabel}
          todaySetRefs={todaySetRefs}
        />

        {showProgressionRecommendation && progressionRecommendation ? (
          <ProgressionRecommendationCard
            applyLoading={isSaving}
            recommendation={progressionRecommendation}
            onApply={
              progressionRecommendation.canApplyWeight
                ? applyProgressionRecommendation
                : undefined
            }
            onDismiss={() =>
              setDismissedProgressionExerciseIndex(activeExerciseIndex)
            }
          />
        ) : null}

        {exerciseMessages.length > 0 ? (
          <section className={styles.exerciseMessages} aria-label="Exercise cautions">
            {exerciseMessages.map((message) => (
              <article
                key={message.id}
                className={getExerciseMessageClassName(message)}
              >
                <p>{message.category.replace(/_/g, " ")}</p>
                <h2>{message.title}</h2>
                <span>{message.body}</span>
              </article>
            ))}
          </section>
        ) : null}

        <div className={styles.setList}>
          {activeExercise.sets.map((setLog, setIndex) => {
            const setState = getSetUiState(setLog, setIndex, activeSetIndex);

            return (
              <WorkoutSetPanel
                key={setLog.setNumber}
                activeExercise={activeExercise}
                isSaving={isSaving}
                onLogSet={handleLogSet}
                onOpenNoteBadge={openNoteBadgeSheet}
                onRepsChange={handleRepsChange}
                onWeightChange={handleWeightChange}
                setIndex={setIndex}
                setLog={setLog}
                setState={setState}
              />
            );
          })}
        </div>

        {showRestTimer ? (
          <WorkoutRestTimerCard
            activeExerciseRestSeconds={activeExerciseRestSeconds}
            onStartRestTimer={handleStartRestTimer}
            restSeconds={restSeconds}
          />
        ) : null}

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
        open={Boolean(noteBadgeDraft)}
        onClose={() => setNoteBadgeDraft(null)}
        title="Exercise notes"
        eyebrow={activeExercise.label}
        description="Capture anything that should inform the next time this movement appears."
        variant="full"
        actions={[
          {
            label: "Save notes",
            tone: "primary",
            loading: isSaving,
            closeOnClick: false,
            onClick: saveNoteBadgeDraft,
          },
          {
            label: "Cancel",
            tone: "gray",
            onClick: () => setNoteBadgeDraft(null),
          },
        ]}
      >
        {noteBadgeDraft ? (
          <div className={styles.noteBadgeForm}>
            <label>
              <span>Exercise note</span>
              <textarea
                value={noteBadgeDraft.exerciseNotes}
                maxLength={1000}
                placeholder="Example: Keep elbows tucked. Try more weight only if every set feels clean."
                onChange={(event) =>
                  setNoteBadgeDraft({
                    ...noteBadgeDraft,
                    exerciseNotes: event.currentTarget.value,
                  })
                }
              />
            </label>

            <div className={styles.badgeGrid} aria-label="Exercise badges">
              {workoutBadgeOptions.map((badge) => {
                const isSelected = noteBadgeDraft.badgeIds.includes(badge.id);

                return (
                  <button
                    key={badge.id}
                    type="button"
                    className={clsx(
                      styles.badgeOption,
                      isSelected && styles.badgeOptionSelected
                    )}
                    aria-pressed={isSelected}
                    onClick={() => toggleDraftBadge(badge.id)}
                  >
                    <strong>{badge.label}</strong>
                    <span>{badge.description}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </BottomSheet>

      <BottomSheet
        open={Boolean(advisoryAttempt)}
        onClose={() => setAdvisoryAttempt(null)}
        title="Progression check"
        description="LiftLogic has not seen this target completed at the current weight yet. Staying here keeps the increase earned instead of rushed."
        actions={[
          {
            label: "Stay here",
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
          {advisoryRequestedIncrease
            ? `Requested jump: ${advisoryRequestedIncrease}. `
            : ""}
          You can still override this. The guardrail is based on your logged
          sets, reps, and progression history.
        </p>
      </BottomSheet>

      <BottomSheet
        open={restSeconds !== null}
        onClose={() => setRestSeconds(null)}
        title={isRestTimerComplete ? "Rest complete" : "Resting..."}
        eyebrow={isRestTimerComplete ? "Next set ready" : "Set complete"}
        variant="full"
        className={styles.restTimerBottomSheet}
        description={
          isRestTimerComplete
            ? "Move when you are ready, or add a little more rest if the last set was heavy."
            : "Use this window to set up your next set or exercise."
        }
        actions={[
          {
            label:
              isRestTimerComplete && timerNextExercise
                ? "Start next exercise"
                : isRestTimerComplete
                  ? "Done"
                  : "Skip rest",
            tone: "primary",
            onClick: handleSkipRest,
          },
          {
            label: "+30 sec",
            tone: "gray",
            variant: "outline",
            closeOnClick: false,
            onClick: handleAddRestTime,
          },
          {
            label: "Cancel",
            tone: "gray",
            variant: "outline",
            onClick: () => setRestSeconds(null),
          },
        ]}
      >
        <div className={styles.restTimerSheet}>
          <p
            className={clsx(
              styles.timer,
              isRestTimerComplete && styles.timerComplete
            )}
          >
            {formatTimer(restSeconds ?? 0)}
          </p>
          {timerNextExercise ? (
            <article className={styles.timerNextCard}>
              <span>Next up</span>
              <strong>{timerNextExercise.label}</strong>
              <p>{formatTimerExerciseTarget(timerNextExercise)}</p>
            </article>
          ) : (
            <article className={styles.timerNextCard}>
              <span>Next up</span>
              <strong>Workout wrap-up</strong>
              <p>Finish your final notes when you are ready.</p>
            </article>
          )}
        </div>
      </BottomSheet>
    </section>
  );
};

export default WorkoutExercise;
