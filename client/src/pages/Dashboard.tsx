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
import { generateWorkoutPreview } from "../utils/generateWorkoutPreview";
import type { GeneratedWorkoutPreview } from "../utils/generateWorkoutPreview";
import { useUserFlow } from "../utils/userFlow";
import {
  readEditedWorkoutPreview,
  readSubmittedAnswers,
} from "../utils/workoutStorage";
import styles from "../styles/components/dashboard.module.scss";

type SelectedWorkoutByDate = Record<string, string>;

const getStartOfWeek = (date: Date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

const getDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getEndOfWeek = (date: Date) => {
  const end = getStartOfWeek(date);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

const isSameDate = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const getSessionDate = (session: WorkoutSessionDto) =>
  new Date(session.scheduledFor);

const getDayWorkoutStatus = (
  date: Date,
  workoutSessions: WorkoutSessionDto[]
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

  return "not-started";
};

const getWeekDays = (
  date: Date,
  workoutSessions: WorkoutSessionDto[]
): WeekDayOption[] => {
  const start = getStartOfWeek(date);

  return Array.from({ length: 7 }, (_, index) => {
    const nextDate = new Date(start);
    nextDate.setDate(start.getDate() + index);

    return {
      date: nextDate,
      workoutStatus: getDayWorkoutStatus(nextDate, workoutSessions),
    };
  });
};

const findWorkoutSessionForDate = (
  workoutSessions: WorkoutSessionDto[],
  date: Date,
  programDayId?: string,
  status?: WorkoutSessionDto["status"]
) =>
  workoutSessions
    .filter(
      (session) =>
        (!programDayId || session.programDayId === programDayId) &&
        (!status || session.status === status) &&
        isSameDate(getSessionDate(session), date)
    )
    .sort(
      (left, right) =>
        new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime()
    )[0] ?? null;

const resolveDashboardPreview = (
  workoutPlan: ReturnType<typeof useUserFlow>["workoutPlan"]
): GeneratedWorkoutPreview | null => {
  if (workoutPlan) {
    return workoutPlan.editedPreview ?? workoutPlan.suggestedPreview;
  }

  const submittedAnswers = readSubmittedAnswers();

  if (!submittedAnswers) {
    return null;
  }

  const suggestedPreview = generateWorkoutPreview(submittedAnswers);
  const editedPreview = readEditedWorkoutPreview();

  return editedPreview?.programId === suggestedPreview.programId
    ? editedPreview
    : suggestedPreview;
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
    () => resolveDashboardPreview(workoutPlan),
    [workoutPlan]
  );
  const weekDays = useMemo(
    () => getWeekDays(selectedDate, weekWorkoutSessions),
    [selectedDate, weekWorkoutSessions]
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
  const workoutDay =
    preview?.days.find(
      (day) => day.id === sessionForSelectedDate?.programDayId
    ) ??
    availableWorkoutDays.find((day) => day.id === selectedWorkoutId) ??
    availableWorkoutDays.find(
      (day) => day.id === activeSessionForSelectedDate?.programDayId
    ) ??
    availableWorkoutDays[0] ??
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
  const workoutOptions = completedWorkoutSession
    ? workoutDay
      ? [workoutDay]
      : []
    : availableWorkoutDays;

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
    return <p className="text-muted">Loading dashboard...</p>;
  }

  if (error) {
    return <p className="text-muted">We could not load your dashboard yet. Please refresh.</p>;
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
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
        <WorkoutCard
          actionLabel={activeWorkoutSession ? "Resume Workout" : "Start Workout"}
          availableWorkoutDays={workoutOptions}
          completionPercentage={currentWorkoutSession?.completionPercentage ?? 0}
          date={selectedDate}
          isStartingWorkout={isStartingWorkout}
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
