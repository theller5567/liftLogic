import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import AppShell from "../components/app/AppShell";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import WeekSelector, { type WeekDayOption } from "../components/dashboard/WeekSelector";
import WorkoutCard from "../components/dashboard/WorkoutCard";
import {
  createWorkoutSession,
  getWorkoutSessions,
} from "../services/api";
import type { WorkoutSessionDto } from "../../../shared/types/workoutSession.types";
import type { GeneratedWorkoutPreview } from "../utils/generateWorkoutPreview";
import { useUserFlow } from "../utils/userFlow";
import { resolveCurrentWorkoutPreview } from "../utils/workoutPlanPreview";
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
  const { destination, error, isLoading, profile, workoutPlan } = useUserFlow();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [startWorkoutError, setStartWorkoutError] = useState<string | null>(null);
  const [workoutSessionsError, setWorkoutSessionsError] = useState<string | null>(null);
  const [weekWorkoutSessions, setWeekWorkoutSessions] = useState<WorkoutSessionDto[]>([]);
  const [isStartingWorkout, setIsStartingWorkout] = useState(false);
  const [selectedWorkoutByDate, setSelectedWorkoutByDate] =
    useState<SelectedWorkoutByDate>({});
  const preview = useMemo(
    () => resolveCurrentWorkoutPreview(workoutPlan),
    [workoutPlan]
  );
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

  if (isLoading) {
    return <p className="text-muted notificationMessage">Loading dashboard...</p>;
  }

  if (error) {
    return <p className="text-muted notificationMessage">We could not load your dashboard yet. Please refresh.</p>;
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
            preview ? `${preview.daysPerWeek} of 7 days scheduled` : undefined
          }
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
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
          <p className="text-muted">{workoutSessionsError}</p>
        ) : null}
        {startWorkoutError ? (
          <p className="text-muted">{startWorkoutError}</p>
        ) : null}
      </section>
    </AppShell>
  );
};

export default Dashboard;
