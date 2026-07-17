import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AppShell from "../components/app/AppShell";
import Button from "../components/Button";
import InlineStatus from "../components/ui/InlineStatus";
import PageHeader from "../components/ui/PageHeader";
import { getWorkoutSessions } from "../services/api";
import type { WorkoutSessionDto } from "../../../shared/types/workoutSession.types";
import {
  getDateKey,
  getSessionDate,
  isSameDate,
} from "../utils/workoutSessionDates";
import { formatWorkoutDisplayLabel } from "../utils/workoutDisplayLabel";
import styles from "../styles/pages/calendar.module.scss";

type CalendarDay = {
  date: Date;
  inCurrentMonth: boolean;
};

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

const dayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });

const detailDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
  weekday: "long",
});

const getStartOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const getEndOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

const getCalendarGridDays = (visibleMonth: Date): CalendarDay[] => {
  const monthStart = getStartOfMonth(visibleMonth);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());
  gridStart.setHours(0, 0, 0, 0);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);

    return {
      date,
      inCurrentMonth: date.getMonth() === visibleMonth.getMonth(),
    };
  });
};

const getSessionsForDate = (sessions: WorkoutSessionDto[], date: Date) =>
  sessions
    .filter((session) => isSameDate(getSessionDate(session), date))
    .sort(
      (left, right) =>
        new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime()
    );

const getDayStatus = (sessions: WorkoutSessionDto[]) => {
  if (sessions.some((session) => session.status === "completed")) {
    return "completed";
  }

  if (sessions.some((session) => session.status === "in_progress")) {
    return "started";
  }

  return "empty";
};

const getPreviousMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() - 1, 1);

const getNextMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 1);

const Calendar = () => {
  const navigate = useNavigate();
  const [visibleMonth, setVisibleMonth] = useState(() => getStartOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSessionDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const today = new Date();
  const calendarDays = useMemo(
    () => getCalendarGridDays(visibleMonth),
    [visibleMonth]
  );
  const weekdayLabels = useMemo(
    () => calendarDays.slice(0, 7).map((day) => dayFormatter.format(day.date)),
    [calendarDays]
  );
  const selectedDateSessions = useMemo(
    () => getSessionsForDate(workoutSessions, selectedDate),
    [selectedDate, workoutSessions]
  );

  useEffect(() => {
    let isMounted = true;

    const loadMonthSessions = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const { workoutSessions: sessions } = await getWorkoutSessions({
          dateFrom: getStartOfMonth(visibleMonth).toISOString(),
          dateTo: getEndOfMonth(visibleMonth).toISOString(),
        });

        if (isMounted) {
          setWorkoutSessions(sessions);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "We could not load your calendar yet."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadMonthSessions();

    return () => {
      isMounted = false;
    };
  }, [visibleMonth]);

  const handleMonthChange = (nextMonth: Date) => {
    setVisibleMonth(nextMonth);

    if (selectedDate.getMonth() !== nextMonth.getMonth()) {
      setSelectedDate(getStartOfMonth(nextMonth));
    }
  };

  return (
    <AppShell>
      <section className={styles.calendarPage}>
        <PageHeader
          eyebrow="Calendar"
          title={monthFormatter.format(visibleMonth)}
          action={
            <div className={styles.monthControls}>
              <button
                aria-label="Previous month"
                type="button"
                onClick={() => handleMonthChange(getPreviousMonth(visibleMonth))}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                aria-label="Next month"
                type="button"
                onClick={() => handleMonthChange(getNextMonth(visibleMonth))}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          }
        />

        {loadError ? (
          <InlineStatus
            tone="error"
            title="Calendar could not refresh"
            message={loadError}
          />
        ) : null}

        <div className={styles.weekdayGrid} aria-hidden="true">
          {weekdayLabels.map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>

        <div className={styles.monthGrid} aria-label="Workout calendar month">
          {calendarDays.map((day) => {
            const sessionsForDay = getSessionsForDate(workoutSessions, day.date);
            const status = getDayStatus(sessionsForDay);
            const isSelected = isSameDate(day.date, selectedDate);
            const isToday = isSameDate(day.date, today);

            return (
              <button
                key={getDateKey(day.date)}
                className={[
                  styles.dayButton,
                  !day.inCurrentMonth ? styles.dayOutsideMonth : "",
                  isSelected ? styles.daySelected : "",
                  isToday ? styles.dayToday : "",
                ].join(" ")}
                type="button"
                onClick={() => setSelectedDate(day.date)}
              >
                <span>{day.date.getDate()}</span>
                <i className={styles[`status-${status}`]} />
              </button>
            );
          })}
        </div>

        <section className={styles.dayDetails}>
          <div className={styles.dayDetailsHeader}>
            <div>
              <p>Selected day</p>
              <h2>{detailDateFormatter.format(selectedDate)}</h2>
            </div>
            {isLoading ? (
              <InlineStatus
                className={styles.dayDetailsStatus}
                tone="loading"
                title="Loading sessions..."
              />
            ) : null}
          </div>

          {selectedDateSessions.length > 0 ? (
            <div className={styles.sessionList}>
              {selectedDateSessions.map((session) => (
                <article key={session._id} className={styles.sessionCard}>
                  <div>
                    <p>{session.status.replace("_", " ")}</p>
                    <h3>
                      <span>Workout</span>
                      {formatWorkoutDisplayLabel(session.programDayLabel)}
                    </h3>
                  </div>
                  <div className={styles.sessionMetrics}>
                    <span>{session.completionPercentage}%</span>
                    <span>
                      {session.completedExerciseCount}/{session.totalExerciseCount} exercises
                    </span>
                  </div>
                  <Button
                    label={
                      session.status === "completed"
                        ? "View summary"
                        : "Resume workout"
                    }
                    size="medium"
                    tone={session.status === "completed" ? "secondary" : "primary"}
                    onClick={() =>
                      navigate(
                        session.status === "completed"
                          ? `/workout/${session._id}/summary`
                          : `/workout/${session._id}`
                      )
                    }
                  />
                </article>
              ))}
            </div>
          ) : (
            <article className={styles.emptyState}>
              <h3>No workout logged</h3>
              <p>This day does not have an in-progress or completed workout yet.</p>
            </article>
          )}
        </section>
      </section>
    </AppShell>
  );
};

export default Calendar;
