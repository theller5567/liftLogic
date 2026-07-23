import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";

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
import {
  getBarbellWeight,
  getPlateInventory,
  getPlateLoadingUnit,
  type WeightStepKey,
} from "../../../shared/types/userSettings.types";
import type {
  CurrentProgramScope,
  ExerciseHistoryScopeOptions,
} from "../../../shared/utils/workoutSessionScope";
import {
  getExerciseById,
  normalizeLibraryIdToEstimatorKey,
} from "../../../shared/utils/exerciseLibraryAdapter";
import {
  getLoadFeasibility,
  parsePrescriptionTopReps,
  type LoadFeasibilityResult,
} from "../../../shared/utils/loadFeasibility";
import { resolveLoadFeasibilityCapacity } from "../../../shared/utils/loadFeasibilityCapacity";
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
import { useUserMessageVisibility } from "../utils/useUserMessageVisibility";
import { getWeightStepForKey, useUserSettings } from "../utils/userSettings";
import { createExerciseSlugFromParts } from "../utils/exerciseLibraryDisplay";
import PlateCalculator from "../components/PlateCalculator";

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

type FeasibilityIncreaseAttempt = AdvisoryAttempt & {
  feasibility: LoadFeasibilityResult;
};

type SetUiState = "active" | "completed" | "inactive";

type NoteBadgeDraft = {
  badgeIds: WorkoutBadgeId[];
  exerciseNotes: string;
};

const shouldOpenAdjustmentSheetFromRouteState = (state: unknown) =>
  typeof state === "object" &&
  state !== null &&
  "openAdjustmentSheet" in state &&
  state.openAdjustmentSheet === true;

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

const canUsePlateCalculator = (exerciseId: string) => {
  const exercise = getExerciseById(exerciseId);

  return (
    exercise?.equipmentType === "barbell" ||
    exercise?.equipmentType === "smith_machine"
  );
};

const formatTimerExerciseTarget = (exerciseLog: WorkoutExerciseLog) => {
  const { reps, sets, suggestedWeight, weightUnit } =
    exerciseLog.prescriptionSnapshot;
  const load =
    suggestedWeight !== undefined ? ` • ${suggestedWeight} ${weightUnit ?? "lb"}` : "";

  return `${sets} sets • ${reps} reps${load}`;
};

const getFeasibilityStatusLabel = (
  status: LoadFeasibilityResult["status"] | undefined
) => {
  switch (status) {
    case "safe":
      return "Manageable";
    case "challenging":
      return "Challenging";
    case "limit":
      return "Near limit";
    case "too_heavy":
      return "Too heavy";
    case "unknown":
    default:
      return "Unknown";
  }
};

const WorkoutExercise = () => {
  const { exerciseIndex } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const activeExerciseIndex = Number(exerciseIndex);
  const { priorSessions, session, setSession } = useWorkoutSessionRouteContext();
  const { settings } = useUserSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showPlateCalculator, setShowPlateCalculator] = useState(false);
  const [plateCalculatorSetIndex, setPlateCalculatorSetIndex] = useState<
    number | null
  >(null);

  const [advisoryAttempt, setAdvisoryAttempt] =
    useState<AdvisoryAttempt | null>(null);
  const [feasibilityIncreaseAttempt, setFeasibilityIncreaseAttempt] =
    useState<FeasibilityIncreaseAttempt | null>(null);
  const [noteBadgeDraft, setNoteBadgeDraft] = useState<NoteBadgeDraft | null>(
    null
  );
  const [isAdjustmentSheetOpen, setIsAdjustmentSheetOpen] = useState(() =>
    shouldOpenAdjustmentSheetFromRouteState(location.state)
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
      setRestSeconds((currentSeconds) => {
        if (currentSeconds === null) {
          return null;
        }

        return currentSeconds <= 1 ? null : currentSeconds - 1;
      });
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
  const generatedExerciseMessages = useMemo(
    () =>
      activeExercise
        ? getUserMessagesForSurface(
            buildUserMessages({
              activeExerciseId: activeExercise.exerciseId,
              currentProgramScope,
              exerciseHistoryScope,
              messagePreferences: settings.messages,
              sessions: [...priorSessions, session],
            }),
            "workout_exercise"
          )
        : [],
    [
      activeExercise,
      currentProgramScope,
      exerciseHistoryScope,
      priorSessions,
      session,
      settings.messages,
    ]
  );
  const {
    dismissMessage: dismissExerciseMessage,
    visibleMessages: exerciseMessages,
  } = useUserMessageVisibility({
    messages: generatedExerciseMessages,
    surface: "workout_exercise",
  });
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
  const currentExerciseTargetWeight =
    activeExercise?.sets.find((setLog) => !setLog.completed)?.weight ??
    activeExercise?.sets[0]?.weight ??
    activeExercise?.prescriptionSnapshot.suggestedWeight;
  const adjustedWeightUnit =
    activeExercise?.prescriptionSnapshot.weightUnit ?? "lb";
  const plateLoadingUnit = getPlateLoadingUnit(settings);
  const plateCalculatorInventory = getPlateInventory(settings);
  const plateCalculatorBarbellWeight = getBarbellWeight(settings);
  const showPlateCalculatorAction = activeExercise
    ? canUsePlateCalculator(activeExercise.exerciseId)
    : false;
  const selectedPlateCalculatorSet =
    activeExercise && plateCalculatorSetIndex !== null
      ? activeExercise.sets[plateCalculatorSetIndex]
      : null;
  const plateCalculatorTargetWeight =
    selectedPlateCalculatorSet?.weight ?? currentExerciseTargetWeight;
  const activeExerciseEstimatorKey = activeExercise
    ? normalizeLibraryIdToEstimatorKey(activeExercise.exerciseId)
    : null;
  const activeExerciseFeasibility = useMemo(() => {
    if (
      !activeExercise ||
      !activeExerciseEstimatorKey ||
      currentExerciseTargetWeight === undefined
    ) {
      return null;
    }

    const capacity = resolveLoadFeasibilityCapacity({
      canonicalEstimatorKey: activeExerciseEstimatorKey,
      exerciseId: activeExercise.exerciseId,
      workoutSessions: priorSessions,
      weightUnit: adjustedWeightUnit,
    });
    const equipmentType =
      weightEstimationRules.exerciseMeta[activeExerciseEstimatorKey].equipmentType;

    return getLoadFeasibility({
      assignedWeight: currentExerciseTargetWeight,
      capacity: capacity.capacity,
      confidence: capacity.confidence,
      equipmentType,
      reps: activeExercise.prescriptionSnapshot.reps,
      sets: activeExercise.prescriptionSnapshot.sets,
      weightUnit: adjustedWeightUnit,
    });
  }, [
    activeExercise,
    activeExerciseEstimatorKey,
    adjustedWeightUnit,
    currentExerciseTargetWeight,
    priorSessions,
  ]);
  const getFeasibilityForWeight = (nextWeight: number) => {
    if (!activeExercise || !activeExerciseEstimatorKey) {
      return null;
    }

    const capacity = resolveLoadFeasibilityCapacity({
      canonicalEstimatorKey: activeExerciseEstimatorKey,
      exerciseId: activeExercise.exerciseId,
      workoutSessions: priorSessions,
      weightUnit: adjustedWeightUnit,
    });
    const equipmentType =
      weightEstimationRules.exerciseMeta[activeExerciseEstimatorKey].equipmentType;

    return getLoadFeasibility({
      assignedWeight: nextWeight,
      capacity: capacity.capacity,
      confidence: capacity.confidence,
      equipmentType,
      reps: activeExercise.prescriptionSnapshot.reps,
      sets: activeExercise.prescriptionSnapshot.sets,
      weightUnit: adjustedWeightUnit,
    });
  };
  const earlyMissLoadSignal = useMemo(() => {
    if (!activeExercise || allSetsCompleted) {
      return false;
    }

    const targetReps = parsePrescriptionTopReps(
      activeExercise.prescriptionSnapshot.reps
    );

    if (!targetReps) {
      return false;
    }

    const completedSets = activeExercise.sets.filter(
      (setLog) => setLog.completed && setLog.actualReps !== undefined
    );
    let severeMissCount = 0;
    let largestMiss = 0;

    for (const setLog of completedSets) {
      const setTargetReps =
        parsePrescriptionTopReps(setLog.targetReps ?? "") ?? targetReps;
      const miss = Math.max(0, setTargetReps - (setLog.actualReps ?? 0));

      largestMiss = Math.max(largestMiss, miss);

      if (miss >= 2) {
        severeMissCount += 1;
      }
    }

    return largestMiss >= 4 || severeMissCount >= 2;
  }, [activeExercise, allSetsCompleted]);
  const showActiveFeasibilityNote =
    Boolean(activeExerciseFeasibility) &&
    activeExerciseFeasibility?.status !== "safe" &&
    activeExerciseFeasibility?.status !== "unknown" &&
    !allSetsCompleted;
  const feasibleAdjustmentWeight = activeExerciseFeasibility?.suggestedWeight;
  const dropOneStepAdjustmentWeight =
    currentExerciseTargetWeight !== undefined
      ? Math.max(0, currentExerciseTargetWeight - activeExerciseWeightStep)
      : undefined;
  const suggestedAdjustmentWeight =
    (earlyMissLoadSignal ? dropOneStepAdjustmentWeight : undefined) ??
    (activeExerciseFeasibility?.status === "too_heavy"
      ? feasibleAdjustmentWeight
      : undefined) ??
    progressionRecommendation?.recommendedWeight ??
    dropOneStepAdjustmentWeight;
  const showFeasibleWeightAction =
    feasibleAdjustmentWeight !== undefined &&
    feasibleAdjustmentWeight !== currentExerciseTargetWeight &&
    activeExerciseFeasibility?.status !== "unknown";
  const showSuggestedAdjustmentAction =
    !showFeasibleWeightAction &&
    suggestedAdjustmentWeight !== undefined &&
    suggestedAdjustmentWeight !== currentExerciseTargetWeight;
  const showDropOneStepAction =
    dropOneStepAdjustmentWeight !== undefined &&
    dropOneStepAdjustmentWeight !== currentExerciseTargetWeight &&
    dropOneStepAdjustmentWeight !== feasibleAdjustmentWeight &&
    dropOneStepAdjustmentWeight !== suggestedAdjustmentWeight;
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
  const shouldOpenAdjustmentSheet = shouldOpenAdjustmentSheetFromRouteState(
    location.state
  );

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

  useEffect(() => {
    if (!shouldOpenAdjustmentSheet) {
      return;
    }

    navigate(location.pathname, {
      replace: true,
      state: null,
    });
  }, [activeExercise, location.pathname, navigate, shouldOpenAdjustmentSheet]);

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

    if (direction === "increase") {
      const feasibility = getFeasibilityForWeight(nextWeight);

      if (feasibility?.status === "too_heavy") {
        setFeasibilityIncreaseAttempt({
          feasibility,
          nextWeight,
          previousWeight,
          setIndex,
        });
        return;
      }
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

  const applyFeasibilityIncrease = () => {
    if (!feasibilityIncreaseAttempt) {
      return;
    }

    applySetUpdate(
      feasibilityIncreaseAttempt.setIndex,
      (setLog, exerciseLog) => ({
        ...setLog,
        weight: feasibilityIncreaseAttempt.nextWeight,
        weightUnit: setLog.weightUnit ?? exerciseLog.prescriptionSnapshot.weightUnit,
      })
    );
    setFeasibilityIncreaseAttempt(null);
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

  const applyExerciseWeightAdjustment = async (nextWeight: number) => {
    if (!activeExercise) {
      return;
    }

    const nextExerciseLogs = session.exerciseLogs.map((exerciseLog, index) => {
      if (index !== activeExerciseIndex) {
        return exerciseLog;
      }

      return {
        ...exerciseLog,
        prescriptionSnapshot: {
          ...exerciseLog.prescriptionSnapshot,
          suggestedWeight: nextWeight,
          weightUnit:
            exerciseLog.prescriptionSnapshot.weightUnit ?? adjustedWeightUnit,
        },
        sets: exerciseLog.sets.map((setLog) =>
          setLog.completed
            ? setLog
            : {
                ...setLog,
                weight: nextWeight,
                weightUnit:
                  setLog.weightUnit ??
                  exerciseLog.prescriptionSnapshot.weightUnit ??
                  adjustedWeightUnit,
              }
        ),
      };
    });

    const savedSession = await persistExerciseLogs(nextExerciseLogs);

    if (savedSession) {
      setIsAdjustmentSheetOpen(false);
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

  const openPlateCalculator = (setIndex: number) => {
    setPlateCalculatorSetIndex(setIndex);
    setShowPlateCalculator(true);
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
                ? progressionRecommendation.state === "reduce_or_modify"
                  ? () => setIsAdjustmentSheetOpen(true)
                  : applyProgressionRecommendation
                : undefined
            }
            onDismiss={() =>
              setDismissedProgressionExerciseIndex(activeExerciseIndex)
            }
          />
        ) : null}

        {showActiveFeasibilityNote || earlyMissLoadSignal ? (
          <aside
            className={clsx(
              styles.loadGuardrailCard,
              (activeExerciseFeasibility?.status === "too_heavy" ||
                earlyMissLoadSignal) &&
                styles.loadGuardrailCardDanger
            )}
            aria-label="Load feasibility guidance"
          >
            <div>
              <p>Load check</p>
              <h2>
                {earlyMissLoadSignal
                  ? "Consider dropping the remaining sets"
                  : activeExerciseFeasibility?.status === "too_heavy"
                    ? "This may be too heavy"
                    : activeExerciseFeasibility?.status === "limit"
                      ? "This is near your limit"
                      : "This should be challenging"}
              </h2>
            </div>
            <span>
              {earlyMissLoadSignal
                ? "Your logged reps suggest the current load may be too high for the remaining work."
                : activeExerciseFeasibility?.reason}
            </span>
            {suggestedAdjustmentWeight !== undefined ? (
              <Button
                label={`Adjust to ${suggestedAdjustmentWeight} ${adjustedWeightUnit}`}
                size="small"
                tone={
                  activeExerciseFeasibility?.status === "too_heavy" ||
                  earlyMissLoadSignal
                    ? "primary"
                    : "gray"
                }
                variant={
                  activeExerciseFeasibility?.status === "too_heavy" ||
                  earlyMissLoadSignal
                    ? undefined
                    : "outline"
                }
                onClick={() => setIsAdjustmentSheetOpen(true)}
              />
            ) : null}
          </aside>
        ) : null}

        {exerciseMessages.length > 0 ? (
          <section className={styles.exerciseMessages} aria-label="Exercise cautions">
            {exerciseMessages.map((message) => (
              <article
                key={message.id}
                className={getExerciseMessageClassName(message)}
              >
                <div className={styles.exerciseMessageHeader}>
                  <p>{message.category.replace(/_/g, " ")}</p>
                  <button
                    type="button"
                    aria-label={`Dismiss ${message.title}`}
                    className={styles.exerciseMessageDismiss}
                    onClick={() => dismissExerciseMessage(message)}
                  >
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
                <h2>{message.title}</h2>
                <span>{message.body}</span>
                {currentExerciseTargetWeight !== undefined ? (
                  <Button
                    label="Adjust load"
                    size="small"
                    tone="gray"
                    variant="outline"
                    onClick={() => setIsAdjustmentSheetOpen(true)}
                  />
                ) : null}
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
                onOpenPlateCalculator={openPlateCalculator}
                onOpenNoteBadge={openNoteBadgeSheet}
                onRepsChange={handleRepsChange}
                onWeightChange={handleWeightChange}
                setIndex={setIndex}
                setLog={setLog}
                setState={setState}
                showPlateCalculator={showPlateCalculatorAction}
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
        open={isAdjustmentSheetOpen}
        onClose={() => setIsAdjustmentSheetOpen(false)}
        title="Adjust exercise load"
        eyebrow={activeExercise.label}
        description="Update the remaining sets for this workout so the target matches what you can complete with clean reps."
        actions={[
          ...(showFeasibleWeightAction && feasibleAdjustmentWeight !== undefined
            ? [
                {
                  label: `Use feasible weight: ${feasibleAdjustmentWeight} ${adjustedWeightUnit}`,
                  tone: "primary" as const,
                  loading: isSaving,
                  closeOnClick: false,
                  onClick: () =>
                    applyExerciseWeightAdjustment(feasibleAdjustmentWeight),
                },
              ]
            : []),
          ...(showSuggestedAdjustmentAction && suggestedAdjustmentWeight !== undefined
            ? [
                {
                  label: `Use ${suggestedAdjustmentWeight} ${adjustedWeightUnit}`,
                  tone: "primary" as const,
                  loading: isSaving,
                  closeOnClick: false,
                  onClick: () =>
                    applyExerciseWeightAdjustment(suggestedAdjustmentWeight),
                },
              ]
            : []),
          ...(showDropOneStepAction && dropOneStepAdjustmentWeight !== undefined
            ? [
                {
                  label: `Drop one step to ${dropOneStepAdjustmentWeight} ${adjustedWeightUnit}`,
                  tone: "gray" as const,
                  variant: "outline" as const,
                  loading: isSaving,
                  closeOnClick: false,
                  onClick: () =>
                    applyExerciseWeightAdjustment(dropOneStepAdjustmentWeight),
                },
              ]
            : []),
          {
            label: "Keep current load",
            tone: "gray",
            variant: "outline",
            onClick: () => setIsAdjustmentSheetOpen(false),
          },
        ]}
      >
        <div className={styles.adjustmentSheet}>
          {activeExerciseFeasibility ? (
            <div
              className={clsx(
                styles.adjustmentFeasibility,
                styles[
                  `adjustmentFeasibility--${activeExerciseFeasibility.status}`
                ]
              )}
            >
              <div>
                <span>Feasibility</span>
                <strong>
                  {getFeasibilityStatusLabel(activeExerciseFeasibility.status)}
                </strong>
              </div>
              <p>{activeExerciseFeasibility.reason}</p>
            </div>
          ) : null}
          <dl>
            {currentExerciseTargetWeight !== undefined ? (
              <div>
                <dt>Current target</dt>
                <dd>
                  {currentExerciseTargetWeight} {adjustedWeightUnit}
                </dd>
              </div>
            ) : null}
            {feasibleAdjustmentWeight !== undefined ? (
              <div>
                <dt>Feasible target</dt>
                <dd>
                  {feasibleAdjustmentWeight} {adjustedWeightUnit}
                </dd>
              </div>
            ) : null}
            {progressionRecommendation?.previousWeight !== undefined ? (
              <div>
                <dt>Last logged</dt>
                <dd>
                  {progressionRecommendation.previousWeight}{" "}
                  {progressionRecommendation.weightUnit ?? adjustedWeightUnit}
                </dd>
              </div>
            ) : null}
          </dl>
          <p>
            Completed sets stay as logged. This only changes the remaining sets
            and the saved target for this exercise in the current workout.
          </p>
        </div>
      </BottomSheet>

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
        open={Boolean(feasibilityIncreaseAttempt)}
        onClose={() => setFeasibilityIncreaseAttempt(null)}
        title="This jump looks too heavy"
        description="This weight is above the estimated feasible range for the planned sets and reps."
        actions={[
          {
            label:
              feasibilityIncreaseAttempt?.feasibility.suggestedWeight !==
              undefined
                ? `Use ${feasibilityIncreaseAttempt.feasibility.suggestedWeight} ${adjustedWeightUnit}`
                : "Use safer load",
            tone: "primary",
            closeOnClick: false,
            onClick: () => {
              const suggestedWeight =
                feasibilityIncreaseAttempt?.feasibility.suggestedWeight;

              if (suggestedWeight !== undefined) {
                void applyExerciseWeightAdjustment(suggestedWeight);
              }

              setFeasibilityIncreaseAttempt(null);
            },
          },
          {
            label: "Increase anyway",
            tone: "gray",
            variant: "outline",
            onClick: applyFeasibilityIncrease,
          },
        ]}
      >
        <p className={styles.sheetCopy}>
          {feasibilityIncreaseAttempt
            ? `Requested jump: ${feasibilityIncreaseAttempt.previousWeight} ${adjustedWeightUnit} to ${feasibilityIncreaseAttempt.nextWeight} ${adjustedWeightUnit}. `
            : ""}
          {feasibilityIncreaseAttempt?.feasibility.reason}
        </p>
      </BottomSheet>

      <BottomSheet
        open={showPlateCalculator}
        variant="full"
        onClose={() => {
          setShowPlateCalculator(false);
          setPlateCalculatorSetIndex(null);
        }}
        title="Plate calculator"
        description="Enter your target weight to see the plate breakdown for your barbell."
        actions={[
          {
            label: "Close",
            tone: "gray",
            variant: "outline",
            onClick: () => {
              setShowPlateCalculator(false);
              setPlateCalculatorSetIndex(null);
            },
          },
        ]}
      >
        <PlateCalculator
          key={`${activeExercise.exerciseId}-${plateCalculatorSetIndex ?? "active"}-${plateCalculatorTargetWeight ?? "empty"}`}
          barbellWeight={plateCalculatorBarbellWeight}
          inventory={plateCalculatorInventory}
          targetWeight={plateCalculatorTargetWeight}
          unit={plateLoadingUnit}
        />
      </BottomSheet>

      <BottomSheet
        open={restSeconds !== null}
        onClose={() => setRestSeconds(null)}
        title="Resting..."
        eyebrow="Set complete"
        variant="full"
        className={styles.restTimerBottomSheet}
        description="Use this window to set up your next set or exercise."
        actions={[
          {
            label: "+30 sec",
            tone: "primary",
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
          <p className={styles.timer}>
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
