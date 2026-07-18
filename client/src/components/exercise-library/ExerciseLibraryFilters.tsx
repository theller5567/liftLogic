import { Search } from "lucide-react";

import {
  exerciseLibrary,
  type EquipmentType,
  type ExerciseCategory,
  type ExerciseDifficulty,
  type MuscleGroup,
  type MovementPattern,
} from "../../../../shared/constants/exercise-library";
import styles from "../../styles/pages/exerciseLibrary.module.scss";
import {
  formatExerciseMetadataLabel,
  muscleLabels,
} from "../../utils/exerciseLibraryDisplay";

export type FilterValue<TValue extends string> = "all" | TValue;

type ActiveFilter = {
  key: string;
  label: string;
  onClear: () => void;
};

type ExerciseLibraryFiltersProps = {
  activeFilters: ActiveFilter[];
  categoryFilter: FilterValue<ExerciseCategory>;
  clearFilters: () => void;
  difficultyFilter: FilterValue<ExerciseDifficulty>;
  equipmentFilter: FilterValue<EquipmentType>;
  movementFilter: FilterValue<MovementPattern>;
  muscleFilter: FilterValue<MuscleGroup>;
  query: string;
  updateCategoryFilter: (value: FilterValue<ExerciseCategory>) => void;
  updateDifficultyFilter: (value: FilterValue<ExerciseDifficulty>) => void;
  updateEquipmentFilter: (value: FilterValue<EquipmentType>) => void;
  updateMovementFilter: (value: FilterValue<MovementPattern>) => void;
  updateMuscleFilter: (value: FilterValue<MuscleGroup>) => void;
  updateQuery: (value: string) => void;
};

const ExerciseLibraryFilters = ({
  activeFilters,
  categoryFilter,
  clearFilters,
  difficultyFilter,
  equipmentFilter,
  movementFilter,
  muscleFilter,
  query,
  updateCategoryFilter,
  updateDifficultyFilter,
  updateEquipmentFilter,
  updateMovementFilter,
  updateMuscleFilter,
  updateQuery,
}: ExerciseLibraryFiltersProps) => (
  <section className={styles.filters} aria-label="Exercise filters">
    <div className={styles.searchControls}>
      <label className={styles.searchField}>
        <div>
          <Search aria-hidden="true" size={18} />
          <input
            type="search"
            value={query}
            onChange={(event) => updateQuery(event.currentTarget.value)}
            placeholder="Search by name, alias, muscle, or equipment"
          />
        </div>
      </label>

      <details className={styles.filterMenu}>
        <summary>Filters</summary>
        <div className={styles.filterPanel}>
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
                  {formatExerciseMetadataLabel(equipment)}
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
                  {formatExerciseMetadataLabel(difficulty)}
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
                  {formatExerciseMetadataLabel(category)}
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
                  {formatExerciseMetadataLabel(pattern)}
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
);

export default ExerciseLibraryFilters;
