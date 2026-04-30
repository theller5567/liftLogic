import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";

import AppShell from "../components/app/AppShell";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import WeekSelector, { type WeekDayOption } from "../components/dashboard/WeekSelector";
import WorkoutCard from "../components/dashboard/WorkoutCard";
import { generateWorkoutPreview } from "../utils/generateWorkoutPreview";
import type { GeneratedWorkoutPreview } from "../utils/generateWorkoutPreview";
import { useUserFlow } from "../utils/userFlow";
import {
  readEditedWorkoutPreview,
  readSubmittedAnswers,
} from "../utils/workoutStorage";
import styles from "../styles/components/dashboard.module.scss";

const getStartOfWeek = (date: Date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

const getWeekDays = (date: Date, workoutCount: number): WeekDayOption[] => {
  const start = getStartOfWeek(date);

  return Array.from({ length: 7 }, (_, index) => {
    const nextDate = new Date(start);
    nextDate.setDate(start.getDate() + index);

    return {
      date: nextDate,
      hasWorkout: index < workoutCount,
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
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const preview = useMemo(
    () => resolveDashboardPreview(workoutPlan),
    [workoutPlan]
  );
  const weekDays = useMemo(
    () => getWeekDays(selectedDate, preview?.days.length ?? 0),
    [preview?.days.length, selectedDate]
  );
  const selectedIndex = weekDays.findIndex(
    (day) =>
      day.date.getFullYear() === selectedDate.getFullYear() &&
      day.date.getMonth() === selectedDate.getMonth() &&
      day.date.getDate() === selectedDate.getDate()
  );
  const workoutDay =
    preview && selectedIndex >= 0 && selectedIndex < preview.days.length
      ? preview.days[selectedIndex]
      : null;

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
        <WorkoutCard date={selectedDate} workoutDay={workoutDay} />
      </section>
    </AppShell>
  );
};

export default Dashboard;
