import clsx from "clsx";

import styles from "../../styles/components/dashboard.module.scss";

export type WeekDayOption = {
  date: Date;
  hasWorkout: boolean;
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

const WeekSelector = ({ days, onSelectDate, selectedDate }: WeekSelectorProps) => (
  <section className={styles.weekPanel} aria-label="Schedule for this week">
    <div className={styles.sectionHeading}>
      <h2>Schedule for this week</h2>
      <span>calendar</span>
    </div>
    <div className={styles.weekGrid}>
      {days.map((day) => {
        const isSelected = isSameDate(day.date, selectedDate);

        return (
          <button
            key={day.date.toISOString()}
            className={clsx(styles.dayButton, isSelected && styles.dayButtonSelected)}
            type="button"
            onClick={() => onSelectDate(day.date)}
          >
            {day.hasWorkout ? <span className={styles.workoutDot} /> : null}
            <span>{dayFormatter.format(day.date)}</span>
            <strong>{day.date.getDate()}</strong>
          </button>
        );
      })}
    </div>
  </section>
);

export default WeekSelector;
