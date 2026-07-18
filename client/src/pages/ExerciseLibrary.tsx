import { useMemo, useState } from "react";
import clsx from "clsx";

import {
  exerciseLibrary,
  type EquipmentType,
  type ExerciseCategory,
  type ExerciseDifficulty,
  type MuscleGroup,
  type MovementPattern,
} from "../../../shared/constants/exercise-library";
import AppShell from "../components/app/AppShell";
import ExerciseLibraryFilters, {
  type FilterValue,
} from "../components/exercise-library/ExerciseLibraryFilters";
import ExerciseLibraryResults from "../components/exercise-library/ExerciseLibraryResults";
import PageHeader from "../components/ui/PageHeader";
import StatusPill from "../components/ui/StatusPill";
import styles from "../styles/pages/exerciseLibrary.module.scss";
import {
  formatExerciseMetadataLabel,
  getExerciseDisplayName,
  getExerciseSearchText,
  muscleLabels,
} from "../utils/exerciseLibraryDisplay";

const EXERCISE_BATCH_SIZE = 30;

const ExerciseLibrary = () => {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState<FilterValue<ExerciseCategory>>("all");
  const [muscleFilter, setMuscleFilter] =
    useState<FilterValue<MuscleGroup>>("all");
  const [equipmentFilter, setEquipmentFilter] =
    useState<FilterValue<EquipmentType>>("all");
  const [difficultyFilter, setDifficultyFilter] =
    useState<FilterValue<ExerciseDifficulty>>("all");
  const [movementFilter, setMovementFilter] =
    useState<FilterValue<MovementPattern>>("all");
  const [visibleCount, setVisibleCount] = useState(EXERCISE_BATCH_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filtering can touch hundreds of exercises, so useMemo avoids recalculating
  // the list unless the search query or one of the filters changes.
  const filteredExercises = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return exerciseLibrary.exercises
      // Text search runs against the combined searchable string above.
      .filter((exercise) =>
        normalizedQuery ? getExerciseSearchText(exercise).includes(normalizedQuery) : true
      )
      // Each dropdown keeps all exercises when set to "all"; otherwise it
      // narrows the list by the selected metadata value.
      .filter((exercise) =>
        categoryFilter === "all" ? true : exercise.category === categoryFilter
      )
      .filter((exercise) =>
        muscleFilter === "all"
          ? true
          : exercise.primaryMuscles.includes(muscleFilter) ||
            exercise.secondaryMuscles.includes(muscleFilter)
      )
      .filter((exercise) =>
        equipmentFilter === "all"
          ? true
          : exercise.equipmentType === equipmentFilter
      )
      .filter((exercise) =>
        difficultyFilter === "all"
          ? true
          : exercise.difficulty === difficultyFilter
      )
      .filter((exercise) =>
        movementFilter === "all"
          ? true
          : exercise.movementPattern === movementFilter
      )
      .sort((left, right) =>
        getExerciseDisplayName(left).localeCompare(getExerciseDisplayName(right))
      );
  }, [
    categoryFilter,
    difficultyFilter,
    equipmentFilter,
    movementFilter,
    muscleFilter,
    query,
  ]);

  const resetExerciseBatch = () => {
    setVisibleCount(EXERCISE_BATCH_SIZE);
    setIsLoadingMore(false);
  };

  const updateQuery = (value: string) => {
    resetExerciseBatch();
    setQuery(value);
  };

  const updateCategoryFilter = (value: FilterValue<ExerciseCategory>) => {
    resetExerciseBatch();
    setCategoryFilter(value);
  };

  const updateMuscleFilter = (value: FilterValue<MuscleGroup>) => {
    resetExerciseBatch();
    setMuscleFilter(value);
  };

  const updateEquipmentFilter = (value: FilterValue<EquipmentType>) => {
    resetExerciseBatch();
    setEquipmentFilter(value);
  };

  const updateDifficultyFilter = (value: FilterValue<ExerciseDifficulty>) => {
    resetExerciseBatch();
    setDifficultyFilter(value);
  };

  const updateMovementFilter = (value: FilterValue<MovementPattern>) => {
    resetExerciseBatch();
    setMovementFilter(value);
  };

  const visibleExercises = filteredExercises.slice(0, visibleCount);
  const hasMoreExercises = visibleCount < filteredExercises.length;
  const resultsMotionKey = [
    query.trim(),
    categoryFilter,
    muscleFilter,
    equipmentFilter,
    difficultyFilter,
    movementFilter,
    visibleCount,
  ].join("|");

  const loadMoreExercises = () => {
    if (isLoadingMore || !hasMoreExercises) {
      return;
    }

    setIsLoadingMore(true);
    window.setTimeout(() => {
      setVisibleCount((currentCount) =>
        Math.min(currentCount + EXERCISE_BATCH_SIZE, filteredExercises.length)
      );
      setIsLoadingMore(false);
    }, 350);
  };

  const scrollToTop = () => {
    const appScrollContent = document.getElementById("app-scroll-content");

    if (appScrollContent) {
      appScrollContent.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Shared reset for both the top "Clear filters" button and empty state.
  const clearFilters = () => {
    resetExerciseBatch();
    setQuery("");
    setCategoryFilter("all");
    setMuscleFilter("all");
    setEquipmentFilter("all");
    setDifficultyFilter("all");
    setMovementFilter("all");
  };
  const activeFilters = [
    query.trim()
      ? {
          key: "query",
          label: `Search: ${query.trim()}`,
          onClear: () => updateQuery(""),
        }
      : null,
    muscleFilter !== "all"
      ? {
          key: "muscle",
          label: muscleLabels[muscleFilter],
          onClear: () => updateMuscleFilter("all"),
        }
      : null,
    equipmentFilter !== "all"
      ? {
          key: "equipment",
          label: formatExerciseMetadataLabel(equipmentFilter),
          onClear: () => updateEquipmentFilter("all"),
        }
      : null,
    difficultyFilter !== "all"
      ? {
          key: "difficulty",
          label: formatExerciseMetadataLabel(difficultyFilter),
          onClear: () => updateDifficultyFilter("all"),
        }
      : null,
    categoryFilter !== "all"
      ? {
          key: "category",
          label: formatExerciseMetadataLabel(categoryFilter),
          onClear: () => updateCategoryFilter("all"),
        }
      : null,
    movementFilter !== "all"
      ? {
          key: "movement",
          label: formatExerciseMetadataLabel(movementFilter),
          onClear: () => updateMovementFilter("all"),
        }
      : null,
  ].filter(
    (
      filter
    ): filter is { key: string; label: string; onClear: () => void } =>
      filter !== null
  );

  return (
    <AppShell>
      <section className={styles.libraryPage}>
        <PageHeader
          eyebrow="Exercise Library"
          title="Find the right movement"
          description="Search exercises by muscle, equipment, difficulty, or movement pattern."
          action={<StatusPill tone="action">{filteredExercises.length} exercises</StatusPill>}
        />

        <ExerciseLibraryFilters
          activeFilters={activeFilters}
          categoryFilter={categoryFilter}
          clearFilters={clearFilters}
          difficultyFilter={difficultyFilter}
          equipmentFilter={equipmentFilter}
          movementFilter={movementFilter}
          muscleFilter={muscleFilter}
          query={query}
          updateCategoryFilter={updateCategoryFilter}
          updateDifficultyFilter={updateDifficultyFilter}
          updateEquipmentFilter={updateEquipmentFilter}
          updateMovementFilter={updateMovementFilter}
          updateMuscleFilter={updateMuscleFilter}
          updateQuery={updateQuery}
        />

        <ExerciseLibraryResults
          exercises={visibleExercises}
          motionKey={resultsMotionKey}
        />

        {hasMoreExercises || isLoadingMore ? (
          <div className={styles.loadMoreArea}>
            {isLoadingMore ? (
              <div
                className={clsx(styles.loadMoreStatus, "ll-motion-fade-in")}
                role="status"
              >
                <span aria-hidden="true" />
                <strong>Loading exercises...</strong>
              </div>
            ) : (
              <div className={styles.loadMoreActions}>
                <button type="button" onClick={loadMoreExercises}>
                  Load more exercises
                </button>
                <button type="button" onClick={scrollToTop}>
                  Back to top
                </button>
              </div>
              
              
            )}
            <p>
              Showing {Math.min(visibleCount, filteredExercises.length)} of{" "}
              {filteredExercises.length} exercises
            </p>
          </div>
        ) : null}

        {filteredExercises.length === 0 ? (
          // Empty state appears only after filters/search remove every result.
          <section className={styles.emptyState}>
            <strong>No exercises found</strong>
            <p>Try clearing a filter or searching for a different muscle.</p>
            <button type="button" onClick={clearFilters}>
              Clear filters
            </button>
          </section>
        ) : null}
      </section>
    </AppShell>
  );
};

export default ExerciseLibrary;
