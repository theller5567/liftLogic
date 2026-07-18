import type { KeyboardEvent, RefObject } from "react";
import clsx from "clsx";

import type { GeneratedWorkoutPreview } from "../../utils/generateWorkoutPreview";
import { formatWorkoutDisplayLabel } from "../../utils/workoutDisplayLabel";
import styles from "../../styles/components/workoutPreview.module.scss";

type WorkoutPreviewDayTabsProps = {
  activeDayIndex: number;
  dayTabRefs: RefObject<Record<number, HTMLButtonElement | null>>;
  days: GeneratedWorkoutPreview["days"];
  onSelectDay: (dayIndex: number) => void;
  onTabKeyDown: (
    event: KeyboardEvent<HTMLButtonElement>,
    dayIndex: number
  ) => void;
};

const WorkoutPreviewDayTabs = ({
  activeDayIndex,
  dayTabRefs,
  days,
  onSelectDay,
  onTabKeyDown,
}: WorkoutPreviewDayTabsProps) => (
  <div className={styles.dayTabsContainer}>
    <div className={styles.dayTabs} role="tablist" aria-label="Workout days">
      {days.map((day, dayIndex) => {
        const isActive = dayIndex === activeDayIndex;

        return (
          <button
            key={day.id}
            ref={(node) => {
              dayTabRefs.current[dayIndex] = node;
            }}
            id={`workout-day-tab-${day.id}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`workout-day-panel-${day.id}`}
            className={clsx(styles.dayTab, isActive && styles.active)}
            onClick={() => onSelectDay(dayIndex)}
            onKeyDown={(event) => onTabKeyDown(event, dayIndex)}
          >
            <span className={styles.dayTabLabel}>
              {formatWorkoutDisplayLabel(day.label)}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

export default WorkoutPreviewDayTabs;
