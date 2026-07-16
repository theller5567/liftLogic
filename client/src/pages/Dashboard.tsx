import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import AppShell from "../components/app/AppShell";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import WeekSelector, { type WeekDayOption } from "../components/dashboard/WeekSelector";
import WorkoutCard from "../components/dashboard/WorkoutCard";
import Button from "../components/Button";
import PageLoadingState from "../components/PageLoadingState";
import {
  clearWorkoutFocusBlock,
  createWorkoutSession,
  getWorkoutSessions,
  isApiEnabled,
} from "../services/api";
import type { WorkoutSessionDto } from "../../../shared/types/workoutSession.types";
import {
  getWorkoutFocusLabel,
  isWorkoutFocusBlockActive,
} from "../../../shared/utils/workoutFocus";
import {
  resolvePreviewWeeklySchedule,
  type GeneratedWorkoutPreview,
} from "../utils/generateWorkoutPreview";
import { useUserFlow } from "../utils/userFlow";
import {
  resolveBaseWorkoutPreview,
  resolveCurrentWorkoutFocusBlock,
  resolveCurrentWorkoutPreview,
} from "../utils/workoutPlanPreview";
import { writeWorkoutFocusBlock } from "../utils/workoutStorage";
import {
  findWorkoutSessionForDate,
  getDateKey,
  getEndOfWeek,
  getSessionDate,
  getStartOfWeek,
  isSameDate,
} from "../utils/workoutSessionDates";
import styles from "../styles/components/dashboard.module.scss";

type SelectedWorkoutByDate = Record<string, string>;

const getScheduledWeekdayIndexes = (daysPerWeek: number) => {
  switch (daysPerWeek) {
    case 1:
      return [0];
    case 2:
      return [0, 3];
    case 3:
      return [0, 2, 4];
    case 4:
      return [0, 1, 3, 4];
    case 5:
      return [0, 1, 2, 3, 4];
    case 6:
      return [0, 1, 2, 3, 4, 5];
    default:
      return [0, 1, 2, 3, 4, 5, 6];
  }
};

const resolveScheduledWorkoutDayId = (
  date: Date,
  preview: GeneratedWorkoutPreview | null
) => {
  if (!preview || preview.days.length === 0) {
    return null;
  }

  const weekStart = getStartOfWeek(date);
  const selectedDateStart = new Date(date);
  selectedDateStart.setHours(0, 0, 0, 0);
  const selectedDayIndex = Math.round(
    (selectedDateStart.getTime() - weekStart.getTime()) / 86_400_000
  );
  const weeklySchedule = resolvePreviewWeeklySchedule(preview);
  const scheduleDay = weeklySchedule.find(
    (day) => day.day === selectedDayIndex + 1
  );

  if (scheduleDay) {
    return scheduleDay.type === "workout" ? scheduleDay.workoutDayId : null;
  }

  const scheduledWeekdays = getScheduledWeekdayIndexes(preview.daysPerWeek);
  const scheduledWorkoutIndex = scheduledWeekdays.indexOf(selectedDayIndex);

  if (scheduledWorkoutIndex === -1) {
    return null;
  }

  return preview.days[scheduledWorkoutIndex % preview.days.length]?.id ?? null;
};

const getDayWorkoutStatus = (
  date: Date,
  workoutSessions: WorkoutSessionDto[],
  preview: GeneratedWorkoutPreview | null
): WeekDayOption["workoutStatus"] => {
  const sessionsForDate = workoutSessions.filter((session) =>
    isSameDate(getSessionDate(session), date)
  );

  if (sessionsForDate.some((session) => session.status === "completed")) {
    return "completed";
  }

  if (sessionsForDate.some((session) => session.status === "in_progress")) {
    return "started";
  }

  return resolveScheduledWorkoutDayId(date, preview) ? "not-started" : "rest";
};

const getWeekDays = (
  date: Date,
  workoutSessions: WorkoutSessionDto[],
  preview: GeneratedWorkoutPreview | null
): WeekDayOption[] => {
  const start = getStartOfWeek(date);

  return Array.from({ length: 7 }, (_, index) => {
    const nextDate = new Date(start);
    nextDate.setDate(start.getDate() + index);

    return {
      date: nextDate,
      workoutStatus: getDayWorkoutStatus(nextDate, workoutSessions, preview),
    };
  });
};

const Dashboard = () => {
  const { destination, error, isLoading, refresh, workoutPlan, profile } =
    useUserFlow();
  const navigate = useNavigate();
  const apiEnabled = isApiEnabled();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [startWorkoutError, setStartWorkoutError] = useState<string | null>(null);
  const [workoutSessionsError, setWorkoutSessionsError] = useState<string | null>(null);
  const [stopSpecializationError, setStopSpecializationError] = useState<string | null>(null);
  const [weekWorkoutSessions, setWeekWorkoutSessions] = useState<WorkoutSessionDto[]>([]);
  const [isStartingWorkout, setIsStartingWorkout] = useState(false);
  const [isStoppingSpecialization, setIsStoppingSpecialization] = useState(false);
  const [hasStoppedSpecialization, setHasStoppedSpecialization] = useState(false);
  const [selectedWorkoutByDate, setSelectedWorkoutByDate] =
    useState<SelectedWorkoutByDate>({});
  const focusedPreview = useMemo(
    () => resolveCurrentWorkoutPreview(workoutPlan),
    [workoutPlan]
  );
  const basePreview = useMemo(
    () => resolveBaseWorkoutPreview(workoutPlan),
    [workoutPlan]
  );
  const preview = hasStoppedSpecialization ? basePreview : focusedPreview;
  const activeFocusBlock = useMemo(
    () => resolveCurrentWorkoutFocusBlock(workoutPlan),
    [workoutPlan]
  );
  const isSpecializationActive =
    !hasStoppedSpecialization && isWorkoutFocusBlockActive(activeFocusBlock);
  const weekDays = useMemo(
    () => getWeekDays(selectedDate, weekWorkoutSessions, preview),
    [preview, selectedDate, weekWorkoutSessions]
  );
  const completedWorkoutIds = useMemo(
    () =>
      new Set(
        weekWorkoutSessions
          .filter((session) => session.status === "completed")
          .map((session) => session.programDayId)
      ),
    [weekWorkoutSessions]
  );
  const availableWorkoutDays = useMemo(
    () =>
      preview?.days.filter((day) => !completedWorkoutIds.has(day.id)) ?? [],
    [completedWorkoutIds, preview?.days]
  );
  const selectedDateKey = getDateKey(selectedDate);
  const selectedWorkoutId = selectedWorkoutByDate[selectedDateKey];
  const scheduledWorkoutDayId = resolveScheduledWorkoutDayId(
    selectedDate,
    preview
  );
  const today = new Date();
  const isSelectedDateToday = isSameDate(selectedDate, today);
  const activeSessionForSelectedDate = findWorkoutSessionForDate(
    weekWorkoutSessions,
    selectedDate,
    undefined,
    "in_progress"
  );
  const completedSessionForSelectedDate = findWorkoutSessionForDate(
    weekWorkoutSessions,
    selectedDate,
    undefined,
    "completed"
  );
  const sessionForSelectedDate =
    activeSessionForSelectedDate ?? completedSessionForSelectedDate;
  const selectedScheduledWorkoutDay = availableWorkoutDays.find(
    (day) => day.id === scheduledWorkoutDayId
  );
  const flexibleWorkoutDay =
    isSelectedDateToday && !selectedScheduledWorkoutDay
      ? availableWorkoutDays[0]
      : null;
  const workoutDay =
    preview?.days.find(
      (day) => day.id === sessionForSelectedDate?.programDayId
    ) ??
    availableWorkoutDays.find((day) => day.id === selectedWorkoutId) ??
    selectedScheduledWorkoutDay ??
    flexibleWorkoutDay ??
    null;
  const activeWorkoutSession = workoutDay
    ? findWorkoutSessionForDate(
        weekWorkoutSessions,
        selectedDate,
        workoutDay.id,
        "in_progress"
      )
    : null;
  const completedWorkoutSession = workoutDay
    ? findWorkoutSessionForDate(
        weekWorkoutSessions,
        selectedDate,
        workoutDay.id,
        "completed"
      )
    : null;
  const currentWorkoutSession = activeWorkoutSession ?? completedWorkoutSession;
  const completedPlanWorkoutCount =
    preview?.days.filter((day) => completedWorkoutIds.has(day.id)).length ?? 0;
  const isPlanCompleteForWeek =
    Boolean(preview?.days.length) &&
    completedPlanWorkoutCount >= (preview?.days.length ?? 0);
  const workoutOptions = completedWorkoutSession
    ? workoutDay
      ? [workoutDay]
      : []
    : availableWorkoutDays;
  const selectedDateHasScheduledWorkout = Boolean(scheduledWorkoutDayId);
  const previewWeeklySchedule = preview
    ? resolvePreviewWeeklySchedule(preview)
    : [];
  const scheduledRestDayCount = preview
    ? previewWeeklySchedule.filter((day) => day.type === "rest").length ||
      Math.max(0, 7 - preview.daysPerWeek)
    : 0;

  useEffect(() => {
    if (isLoading || error || (destination && destination !== "/dashboard")) {
      return;
    }

    let isMounted = true;
    const startOfWeek = getStartOfWeek(selectedDate);
    const endOfWeek = getEndOfWeek(selectedDate);

    const loadWeekWorkoutSessions = async () => {
      setWorkoutSessionsError(null);

      try {
        const { workoutSessions } = await getWorkoutSessions({
          dateFrom: startOfWeek.toISOString(),
          dateTo: endOfWeek.toISOString(),
        });

        if (isMounted) {
          setWeekWorkoutSessions(workoutSessions);
        }
      } catch (loadError) {
        if (isMounted) {
          setWorkoutSessionsError(
            loadError instanceof Error
              ? loadError.message
              : "We could not load workout sessions yet."
          );
        }
      }
    };

    void loadWeekWorkoutSessions();

    return () => {
      isMounted = false;
    };
  }, [destination, error, isLoading, selectedDate]);

  const handleWorkoutSelect = (workoutDayId: string) => {
    setSelectedWorkoutByDate((currentSelections) => ({
      ...currentSelections,
      [selectedDateKey]: workoutDayId,
    }));
  };

  const handleStartWorkout = async () => {
    if (!workoutDay) {
      return;
    }

    setIsStartingWorkout(true);
    setStartWorkoutError(null);

    try {
      if (currentWorkoutSession) {
        if (currentWorkoutSession.status === "in_progress") {
          navigate(`/workout/${currentWorkoutSession._id}`);
        }
        return;
      }

      const { workoutSession } = await createWorkoutSession({
        programDayId: workoutDay.id,
        scheduledFor: selectedDate.toISOString(),
      });

      setWeekWorkoutSessions((currentSessions) => [
        ...currentSessions,
        workoutSession,
      ]);
      navigate(`/workout/${workoutSession._id}`);
    } catch (startError) {
      setStartWorkoutError(
        startError instanceof Error
          ? startError.message
          : "We could not start this workout yet."
      );
    } finally {
      setIsStartingWorkout(false);
    }
  };

  const stopSpecialization = async () => {
    setIsStoppingSpecialization(true);
    setStopSpecializationError(null);

    try {
      if (apiEnabled) {
        await clearWorkoutFocusBlock();
      } else {
        writeWorkoutFocusBlock(null);
      }

      setHasStoppedSpecialization(true);
      setSelectedWorkoutByDate({});
    } catch (stopError) {
      setStopSpecializationError(
        stopError instanceof Error
          ? stopError.message
          : "We could not stop this specialization block."
      );
    } finally {
      setIsStoppingSpecialization(false);
    }
  };

  if (isLoading) {
    return <PageLoadingState title="Loading dashboard" />;
  }

  if (error) {
    return (
      <PageLoadingState
        tone="error"
        title="We could not load your dashboard"
        message={error.message}
        onAction={refresh}
      />
    );
  }

  if (destination && destination !== "/dashboard") {
    return <Navigate to={destination} replace />;
  }

  return (
    <AppShell>
      <section className={styles.dashboard}>
        <DashboardHeader
          displayName={profile?.displayName}
          photoUrl={profile?.photoUrl}
        />
        <WeekSelector
          days={weekDays}
          scheduleSummary={
            preview
              ? `${preview.daysPerWeek} workouts • ${scheduledRestDayCount} rest days`
              : undefined
          }
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
        {isSpecializationActive && activeFocusBlock ? (
          <div className={styles.focusNotice}>
            <span>
              {getWorkoutFocusLabel(activeFocusBlock.focusArea)} specialization active until{" "}
              {new Intl.DateTimeFormat(undefined, {
                month: "short",
                day: "numeric",
              }).format(new Date(activeFocusBlock.endsAt))}
            </span>
            <Button
              disabled={isStoppingSpecialization}
              label={isStoppingSpecialization ? "Stopping..." : "Stop block"}
              size="small"
              tone="gray"
              variant="outline"
              onClick={stopSpecialization}
            />
          </div>
        ) : null}
        <WorkoutCard
          actionLabel={activeWorkoutSession ? "Resume Workout" : "Start Workout"}
          availableWorkoutDays={workoutOptions}
          completionPercentage={currentWorkoutSession?.completionPercentage ?? 0}
          date={selectedDate}
          isStartingWorkout={isStartingWorkout}
          isPlanCompleteForWeek={isPlanCompleteForWeek}
          isSelectedDateScheduled={selectedDateHasScheduledWorkout}
          isWorkoutActive={Boolean(activeWorkoutSession)}
          isWorkoutCompleted={Boolean(completedWorkoutSession)}
          onSelectWorkout={handleWorkoutSelect}
          onStartWorkout={handleStartWorkout}
          workoutDay={workoutDay}
          sessionId={currentWorkoutSession?._id}
        />
        {workoutSessionsError ? (
          <div>
            <p className="text-muted">{workoutSessionsError}</p>
            <Button
              label="Retry sessions"
              size="small"
              tone="gray"
              variant="outline"
              onClick={() => setSelectedDate(new Date(selectedDate))}
            />
          </div>
        ) : null}
        {startWorkoutError ? (
          <p className="text-muted">{startWorkoutError}</p>
        ) : null}
        {stopSpecializationError ? (
          <p className="text-muted">{stopSpecializationError}</p>
        ) : null}
      </section>
    </AppShell>
  );
};

export default Dashboard;
