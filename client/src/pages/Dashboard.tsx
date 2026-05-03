import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import AppShell from "../components/app/AppShell";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import WeekSelector, { type WeekDayOption } from "../components/dashboard/WeekSelector";
import WorkoutCard from "../components/dashboard/WorkoutCard";
import { createWorkoutSession } from "../services/api";
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

const getWeekDays = (date: Date): WeekDayOption[] => {
  const start = getStartOfWeek(date);

  return Array.from({ length: 7 }, (_, index) => {
    const nextDate = new Date(start);
    nextDate.setDate(start.getDate() + index);

    return {
      date: nextDate,
      workoutStatus: "not-started",
    };
  });
};

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
  const [isStartingWorkout, setIsStartingWorkout] = useState(false);
  const [selectedWorkoutByDate, setSelectedWorkoutByDate] =
    useState<SelectedWorkoutByDate>({});
  const preview = useMemo(
    () => resolveDashboardPreview(workoutPlan),
    [workoutPlan]
  );
  const weekDays = useMemo(
    () => getWeekDays(selectedDate),
    [selectedDate]
  );
  const completedWorkoutIds = useMemo(() => new Set<string>(), []);
  const availableWorkoutDays = useMemo(
    () =>
      preview?.days.filter((day) => !completedWorkoutIds.has(day.id)) ?? [],
    [completedWorkoutIds, preview?.days]
  );
  const selectedDateKey = getDateKey(selectedDate);
  const selectedWorkoutId = selectedWorkoutByDate[selectedDateKey];
  const workoutDay =
    availableWorkoutDays.find((day) => day.id === selectedWorkoutId) ??
    availableWorkoutDays[0] ??
    null;

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
      const { workoutSession } = await createWorkoutSession({
        programDayId: workoutDay.id,
        scheduledFor: selectedDate.toISOString(),
      });

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
          availableWorkoutDays={availableWorkoutDays}
          date={selectedDate}
          isStartingWorkout={isStartingWorkout}
          onSelectWorkout={handleWorkoutSelect}
          onStartWorkout={handleStartWorkout}
          workoutDay={workoutDay}
        />
        {startWorkoutError ? (
          <p className="text-muted">{startWorkoutError}</p>
        ) : null}
      </section>
    </AppShell>
  );
};

export default Dashboard;
