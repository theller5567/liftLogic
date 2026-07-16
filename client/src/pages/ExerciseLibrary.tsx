import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Search } from "lucide-react";
import clsx from "clsx";

import {
  exerciseLibrary,
  type EquipmentType,
  type ExerciseCategory,
  type ExerciseDefinition,
  type ExerciseDifficulty,
  type MuscleGroup,
  type MovementPattern,
} from "../../../shared/constants/exercise-library";
import AppShell from "../components/app/AppShell";
import styles from "../styles/pages/exerciseLibrary.module.scss";

// Most filters have an "all" option plus one of the real library values.
// This helper type keeps each select strongly typed without making separate
// state shapes for every filter.
type FilterValue<TValue extends string> = "all" | TValue;

const EXERCISE_BATCH_SIZE = 30;

// The exercise data stores muscle ids in code-friendly snake_case.
// This map turns those ids into labels that are nicer for users to read.
const muscleLabels: Record<MuscleGroup, string> = {
  chest: "Chest",
  upper_chest: "Upper chest",
  lower_chest: "Lower chest",
  lats: "Lats",
  upper_back: "Upper back",
  rear_delts: "Rear delts",
  lateral_delts: "Side delts",
  front_delts: "Front delts",
  triceps: "Triceps",
  biceps: "Biceps",
  forearms: "Forearms",
  quadriceps: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  calves: "Calves",
  lower_back: "Lower back",
  scapular_stabilizers: "Scapula",
  abductors: "Abductors",
  adductors: "Adductors",
  core: "Core",
  hip_flexors: "Hip flexors",
  obliques: "Obliques",
  shoulders: "Shoulders",
  tibialis_anterior: "Tibialis",
  traps: "Traps",
};

// Converts ids like "horizontal_press" into "Horizontal Press" for filter
// dropdowns and card metadata.
const formatLabel = (value: string) =>
  value
    .split("_")
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");

// Adds a visual state class to the difficulty pill while still falling back
// to beginner when older exercise rows do not have a difficulty yet.
const getDifficultyClassName = (difficulty?: ExerciseDifficulty) => {
  const resolvedDifficulty = difficulty ?? "beginner";

  return clsx(
    styles.difficultyLevel,
    resolvedDifficulty === "beginner" && styles.difficultyBeginner,
    resolvedDifficulty === "intermediate" && styles.difficultyIntermediate,
    resolvedDifficulty === "advanced" && styles.difficultyAdvanced
  );
};

// The card uses its own modifier class so difficulty colors can affect the
// whole card without inheriting badge positioning styles.
const getDifficultyCardClassName = (difficulty?: ExerciseDifficulty) => {
  const resolvedDifficulty = difficulty ?? "beginner";

  return clsx(
    resolvedDifficulty === "beginner" && styles.exerciseCardBeginner,
    resolvedDifficulty === "intermediate" && styles.exerciseCardIntermediate,
    resolvedDifficulty === "advanced" && styles.exerciseCardAdvanced
  );
};

// Prefer the polished display name when it exists, then fall back to the
// base exercise name from the library.
const getExerciseName = (exercise: ExerciseDefinition) =>
  exercise.displayName ?? exercise.name;

// Builds readable detail-page URLs while keeping the stable exercise id at
// the end. Example: "Back Squat" + "back_squat" => "back-squat_back_squat".
const createExerciseSlug = (exercise: ExerciseDefinition) => {
  const nameSlug = getExerciseName(exercise)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `${nameSlug}_${exercise.id}`;
};

// Builds one searchable text string per exercise. The search box checks this
// instead of only the name, so users can search by alias, muscle, equipment,
// movement pattern, or difficulty.
const getExerciseSearchText = (exercise: ExerciseDefinition) =>
  [
    exercise.id,
    exercise.name,
    exercise.displayName,
    exercise.pluralDisplayName,
    exercise.verbPhrase,
    ...(exercise.aliases ?? []),
    ...(exercise.primaryMuscles ?? []),
    ...(exercise.secondaryMuscles ?? []),
    exercise.equipmentType,
    exercise.movementPattern,
    exercise.category,
    exercise.difficulty,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const ExerciseLibrary = () => {
  // Each filter is controlled state. Updating any of these values causes the
  // filtered exercise list below to recompute.
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
        getExerciseName(left).localeCompare(getExerciseName(right))
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

  const scollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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
          label: formatLabel(equipmentFilter),
          onClear: () => updateEquipmentFilter("all"),
        }
      : null,
    difficultyFilter !== "all"
      ? {
          key: "difficulty",
          label: formatLabel(difficultyFilter),
          onClear: () => updateDifficultyFilter("all"),
        }
      : null,
    categoryFilter !== "all"
      ? {
          key: "category",
          label: formatLabel(categoryFilter),
          onClear: () => updateCategoryFilter("all"),
        }
      : null,
    movementFilter !== "all"
      ? {
          key: "movement",
          label: formatLabel(movementFilter),
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
        <header className={styles.hero}>
          <div>
            <p>Exercise Library</p>
            <h1>Find the right movement</h1>
            <span>
              Search exercises by muscle, equipment, difficulty, or movement
              pattern.
            </span>
          </div>
          <strong>{filteredExercises.length} exercises</strong>
        </header>

        <section className={styles.filters} aria-label="Exercise filters">
          <div className={styles.searchControls}>
            {/* Search is intentionally broad: name, aliases, muscles,
                equipment, pattern, category, and difficulty can all match. */}
            <label className={styles.searchField}>
              <div>
                <Search aria-hidden="true" size={18} />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => updateQuery(event.currentTarget.value)}
                  placeholder="Search by name, alias, muscle, or equipment"
                />
                {/* <div>TEHE</div> */}
              </div>
            </label>

            <details className={styles.filterMenu}>
              <summary>Filters</summary>
              <div className={styles.filterPanel}>
                {/* Filter options come from shared library metadata. New
                    categories/patterns added to the library appear here. */}
                <label>
                  <span>Muscle</span>
                  <select
                    value={muscleFilter}
                    onChange={(event) =>
                      updateMuscleFilter(
                        event.currentTarget.value as FilterValue<MuscleGroup>
                      )
                    }
                  >
                    <option value="all">All muscles</option>
                    {exerciseLibrary.muscleGroups.map((muscle) => (
                      <option key={muscle} value={muscle}>
                        {muscleLabels[muscle]}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Equipment</span>
                  <select
                    value={equipmentFilter}
                    onChange={(event) =>
                      updateEquipmentFilter(
                        event.currentTarget.value as FilterValue<EquipmentType>
                      )
                    }
                  >
                    <option value="all">All equipment</option>
                    {exerciseLibrary.equipmentTypes.map((equipment) => (
                      <option key={equipment} value={equipment}>
                        {formatLabel(equipment)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Difficulty</span>
                  <select
                    value={difficultyFilter}
                    onChange={(event) =>
                      updateDifficultyFilter(
                        event.currentTarget.value as FilterValue<ExerciseDifficulty>
                      )
                    }
                  >
                    <option value="all">All levels</option>
                    {exerciseLibrary.difficultyLevels?.map((difficulty) => (
                      <option key={difficulty} value={difficulty}>
                        {formatLabel(difficulty)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Category</span>
                  <select
                    value={categoryFilter}
                    onChange={(event) =>
                      updateCategoryFilter(
                        event.currentTarget.value as FilterValue<ExerciseCategory>
                      )
                    }
                  >
                    <option value="all">All categories</option>
                    {exerciseLibrary.categories?.map((category) => (
                      <option key={category} value={category}>
                        {formatLabel(category)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Pattern</span>
                  <select
                    value={movementFilter}
                    onChange={(event) =>
                      updateMovementFilter(
                        event.currentTarget.value as FilterValue<MovementPattern>
                      )
                    }
                  >
                    <option value="all">All patterns</option>
                    {exerciseLibrary.movementPatterns.map((pattern) => (
                      <option key={pattern} value={pattern}>
                        {formatLabel(pattern)}
                      </option>
                    ))}
                  </select>
                </label>

                <button type="button" onClick={clearFilters}>
                  Clear filters
                </button>
              </div>
            </details>
          </div>

          {activeFilters.length > 0 ? (
            <div className={styles.activeFilters} aria-label="Active filters">
              {activeFilters.map((filter) => (
                <button key={filter.key} type="button" onClick={filter.onClear}>
                  {filter.label}
                  <span aria-hidden="true">×</span>
                </button>
              ))}
              <button type="button" onClick={clearFilters}>
                Clear all
              </button>
            </div>
          ) : null}
        </section>
        <div className={styles.exerciseGrid}>
          {visibleExercises.map((exercise) => {
            // Show a compact set of muscle tags on the card. The detail page
            // has the full muscle and description information.
            const muscleTags = [
              ...exercise.primaryMuscles,
              ...exercise.secondaryMuscles,
            ].slice(0, 4);

            return (
              <Link
                key={exercise.id}
                className={clsx(
                  styles.exerciseCard,
                  getDifficultyCardClassName(exercise.difficulty)
                )}
                // The detail page will parse the stable id from this slug.
                to={`/exercise-library/${createExerciseSlug(exercise)}`}
              >
                <strong>{getExerciseName(exercise)}</strong>
                {/* <p>Equipment Type: {formatLabel(exercise.equipmentType)}</p> */}
                
                 <span className={getDifficultyClassName(exercise.difficulty)}>{formatLabel(exercise.difficulty ?? "beginner")}</span>
                
                
                <span className={styles.tagList}>
                  {muscleTags.map((muscle) => (
                    <span key={`${exercise.id}-${muscle}`}>
                      {muscleLabels[muscle]}
                    </span>
                  ))}
                </span>
                <span className={styles.cardMeta}>
                {formatLabel(exercise.equipmentType)} •{" "}
                  {formatLabel(exercise.movementPattern)} •{" "}
                  {exercise.isCompound ? "Compound" : "Accessory"}
                </span> 
                <ChevronRight
                  className={styles.cardChevron}
                  aria-hidden="true"
                  size={22}
                />
              </Link>
            );
          })}
        </div>

        {hasMoreExercises || isLoadingMore ? (
          <div className={styles.loadMoreArea}>
            {isLoadingMore ? (
              <div className={styles.loadMoreStatus} role="status">
                <span aria-hidden="true" />
                <strong>Loading exercises...</strong>
              </div>
            ) : (
              <div className="flex">
                <button type="button" onClick={loadMoreExercises}>
                  Load more exercises
                </button>
                <button type="button" onClick={scollToTop}>
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
