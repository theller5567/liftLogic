import clsx from "clsx";
import styles from "../../styles/components/dashboard.module.scss";
import { CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";

export type WorkoutCompletionStatus = "not-started" | "started" | "completed";

export type WeekDayOption = {
  date: Date;
  workoutStatus: WorkoutCompletionStatus;
};

type WeekSelectorProps = {
  days: WeekDayOption[];
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
};

const dayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });

const isSameDate = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const getWorkoutDotClassName = (
  workoutStatus: WorkoutCompletionStatus,
  isToday: boolean
) => {
  if (workoutStatus === "completed") {
    return styles.workoutDotCompleted;
  }

  if (workoutStatus === "started") {
    return isToday ? styles.workoutDotStartedToday : styles.workoutDotStarted;
  }

  return isToday ? styles.workoutDotToday : styles.workoutDotNotStarted;
};

const WeekSelector = ({ days, onSelectDate, selectedDate }: WeekSelectorProps) => (
  <section className={styles.weekPanel} aria-label="Schedule for this week">
    <div className={styles.sectionHeading}>
      <div className="flex flex-column gap-1">
      <h2>This Week</h2>
      <span>4 of 7 days scheduled</span>
      </div>
      <div className="flex flex-center gap-2 text-secondary">
        <Link to="/calendar">View calendar</Link>
      <CalendarDays/>
      </div>
    </div>
    <div className={styles.weekGrid}>
      {days.map((day) => {
        const isSelected = isSameDate(day.date, selectedDate);
        const isToday = isSameDate(day.date, new Date());
        const statusClass = getWorkoutDotClassName(
          day.workoutStatus,
          isToday
        );

        return (
          <button
            key={day.date.toISOString()}
            className={clsx(
              styles.dayButton,
              isSelected && styles.dayButtonSelected,
              isToday && styles.dayButtonToday
            )}
            type="button"
            onClick={() => onSelectDate(day.date)}
          >
            
            <span>{dayFormatter.format(day.date)}</span>
            <strong>{day.date.getDate()}</strong>
            <span className={clsx(styles.workoutDot, statusClass)} />
          </button>
        );
      })}
    </div>
  </section>
);

export default WeekSelector;
