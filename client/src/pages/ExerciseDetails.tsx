import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Dumbbell } from "lucide-react";

import {
  exerciseLibrary,
  type ExerciseDefinition,
  type ExerciseDescription,
  type MuscleGroup,
} from "../../../shared/constants/exercise-library";
import AppShell from "../components/app/AppShell";
import InlineStatus from "../components/ui/InlineStatus";
import styles from "../styles/pages/exerciseLibrary.module.scss";

// The description is loaded asynchronously so the large description module
// can stay out of the main exercise library list page bundle.
type DescriptionState =
  | { status: "loading"; description: null; error: null }
  | { status: "available"; description: ExerciseDescription; error: null }
  | { status: "unavailable"; description: null; error: string };

type ExerciseDetailNavigationState = {
  returnLabel?: string;
  returnTo?: string;
};

// Same display-label map used by the library page. The shared data uses
// stable ids; the UI converts them into friendly labels.
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

// Converts ids like "vertical_pull" into "Vertical Pull" for display.
const formatLabel = (value: string) =>
  value
    .split("_")
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");

// Prefer the library displayName when present, otherwise use the base name.
const getExerciseName = (exercise: ExerciseDefinition) =>
  exercise.displayName ?? exercise.name;

// The route uses a readable name plus the stable id:
//   /exercise-library/back-squat_back_squat
// Exercise ids also contain underscores, so splitting on "_" is unsafe.
// Instead, match against known ids and choose the longest matching suffix.
const getExerciseIdFromSlug = (exerciseSlug: string | undefined) => {
  if (!exerciseSlug) {
    return null;
  }

  return (
    [...exerciseLibrary.exercises]
      .sort((left, right) => right.id.length - left.id.length)
      .find((exercise) => exerciseSlug.endsWith(`_${exercise.id}`))?.id ?? null
  );
};

// Small renderer for repeated ordered-list sections such as setup, execution,
// cues, mistakes, and safety notes.
const DetailSection = ({
  items,
  title,
}: {
  items: string[] | undefined;
  title: string;
}) =>
  items?.length ? (
    <section className={styles.detailPanel}>
      <h2>{title}</h2>
      <ol>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </section>
  ) : null;

const ExerciseDetails = () => {
  // React Router gives us the dynamic route segment from
  // /exercise-library/:exerciseSlug.
  const { exerciseSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const navigationState = location.state as ExerciseDetailNavigationState | null;
  const explicitReturnTo =
    navigationState?.returnTo?.startsWith("/") ? navigationState.returnTo : null;
  const canUseBrowserBack = location.key !== "default";
  const returnLabel =
    navigationState?.returnLabel ??
    (canUseBrowserBack ? "Back" : "Exercise library");
  // Parse the stable exercise id once per slug change.
  const exerciseId = useMemo(
    () => getExerciseIdFromSlug(exerciseSlug),
    [exerciseSlug]
  );
  // Find the lightweight exercise metadata from the main library. This is
  // enough to render the hero/summary before the full description finishes.
  const exercise = useMemo(
    () =>
      exerciseId
        ? exerciseLibrary.exercises.find((candidate) => candidate.id === exerciseId)
        : null,
    [exerciseId]
  );
  const [descriptionState, setDescriptionState] = useState<DescriptionState>({
    status: "loading",
    description: null,
    error: null,
  });

  useEffect(() => {
    if (!exerciseId) {
      return;
    }

    // Prevent state updates if the user navigates away before the dynamic
    // import finishes.
    let isMounted = true;

    const loadDescription = async () => {
      setDescriptionState({
        status: "loading",
        description: null,
        error: null,
      });

      try {
        // Dynamic import creates a separate JS chunk for the full description
        // content. Users only download it when they open a detail page.
        const { getExerciseDescription } = await import(
          "../../../shared/constants/exercise-descriptions"
        );
        const description = getExerciseDescription(exerciseId);

        if (!isMounted) {
          return;
        }

        if (description) {
          setDescriptionState({
            status: "available",
            description,
            error: null,
          });
        } else {
          setDescriptionState({
            status: "unavailable",
            description: null,
            error: "Exercise details are not available yet.",
          });
        }
      } catch {
        if (isMounted) {
          setDescriptionState({
            status: "unavailable",
            description: null,
            error: "We could not load this exercise description.",
          });
        }
      }
    };

    // Fire and forget; the effect owns updating loading/success/error state.
    void loadDescription();

    return () => {
      isMounted = false;
    };
  }, [exerciseId]);

  // Bad URLs or deleted exercise ids safely return users to the library page.
  if (!exerciseId || !exercise) {
    return <Navigate to="/exercise-library" replace />;
  }

  // These arrays are prepared once for cleaner JSX below.
  const description = descriptionState.description;
  const primaryMuscles = exercise.primaryMuscles.map((muscle) => muscleLabels[muscle]);
  const secondaryMuscles = exercise.secondaryMuscles.map(
    (muscle) => muscleLabels[muscle]
  );

  const handleReturn = () => {
    if (explicitReturnTo) {
      navigate(explicitReturnTo);
      return;
    }

    if (canUseBrowserBack) {
      navigate(-1);
      return;
    }

    navigate("/exercise-library");
  };

  return (
    <AppShell>
      <section className={styles.detailPage}>
        <button
          className={styles.backLink}
          type="button"
          onClick={handleReturn}
        >
          <ArrowLeft aria-hidden="true" size={18} />
          {returnLabel}
        </button>

        <header className={styles.detailHero}>
          <div>
            <p>Exercise Details</p>
            <h1>{getExerciseName(exercise)}</h1>
            <span>
              {formatLabel(exercise.movementPattern)} •{" "}
              {formatLabel(exercise.equipmentType)} •{" "}
              {formatLabel(exercise.difficulty ?? "beginner")}
            </span>
          </div>
          <Dumbbell aria-hidden="true" />
        </header>

        <section className={styles.detailSummary}>
          {/* Quick metadata cards stay visible even while the long description
              chunk is loading. */}
          <article>
            <span>Primary muscles</span>
            <strong>{primaryMuscles.join(", ")}</strong>
          </article>
          <article>
            <span>Secondary muscles</span>
            <strong>{secondaryMuscles.join(", ") || "None listed"}</strong>
          </article>
          <article>
            <span>Type</span>
            <strong>{exercise.isCompound ? "Compound" : "Accessory"}</strong>
          </article>
        </section>

        {descriptionState.status === "loading" ? (
          <InlineStatus tone="loading" title="Loading exercise details..." />
        ) : null}

        {descriptionState.error ? (
          <InlineStatus
            tone="error"
            title="Exercise details unavailable"
            message={descriptionState.error}
          />
        ) : null}

        {description ? (
          // Render the structured description fields. Optional fields only
          // appear when the description provides them.
          <div className={styles.detailGrid}>
            <section className={styles.overviewPanel}>
              <h2>Overview</h2>
              <p>{description.overview}</p>
              <dl>
                <div>
                  <dt>Primary target</dt>
                  <dd>{description.primaryTarget}</dd>
                </div>
                {description.secondaryTargets ? (
                  <div>
                    <dt>Secondary targets</dt>
                    <dd>{description.secondaryTargets}</dd>
                  </div>
                ) : null}
              </dl>
            </section>

            <DetailSection title="Setup" items={description.setup} />
            <DetailSection title="How to perform" items={description.execution} />
            <DetailSection title="Coaching cues" items={description.coachingCues} />
            <DetailSection title="Common mistakes" items={description.commonMistakes} />
            <DetailSection title="Safety notes" items={description.safetyNotes} />

            <section className={styles.detailPanel}>
              <h2>Training notes</h2>
              <dl>
                {description.breathing ? (
                  <div>
                    <dt>Breathing</dt>
                    <dd>{description.breathing}</dd>
                  </div>
                ) : null}
                {description.tempo ? (
                  <div>
                    <dt>Tempo</dt>
                    <dd>{description.tempo}</dd>
                  </div>
                ) : null}
                {description.rangeOfMotion ? (
                  <div>
                    <dt>Range of motion</dt>
                    <dd>{description.rangeOfMotion}</dd>
                  </div>
                ) : null}
                {description.difficultyNotes ? (
                  <div>
                    <dt>Difficulty</dt>
                    <dd>{description.difficultyNotes}</dd>
                  </div>
                ) : null}
              </dl>
            </section>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
};

export default ExerciseDetails;
