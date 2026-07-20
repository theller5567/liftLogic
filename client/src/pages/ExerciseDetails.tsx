import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import {
  exerciseLibrary,
  type ExerciseDescription,
} from "../../../shared/constants/exercise-library";
import AppShell from "../components/app/AppShell";
import Button from "../components/Button";
import ExerciseDetailSection from "../components/exercise-library/ExerciseDetailSection";
import InlineStatus from "../components/ui/InlineStatus";
import styles from "../styles/pages/exerciseLibrary.module.scss";
import {
  formatExerciseMetadataLabel,
  getExerciseDisplayName,
  getExerciseIdFromSlug,
  muscleLabels,
} from "../utils/exerciseLibraryDisplay";
import { useUserSettings } from "../utils/userSettings";

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

const ExerciseDetails = () => {
  // React Router gives us the dynamic route segment from
  // /exercise-library/:exerciseSlug.
  const { exerciseSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const navigationState = location.state as ExerciseDetailNavigationState | null;
  const { saveSettings, settings } = useUserSettings();
  const [historyMessage, setHistoryMessage] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isSavingHistory, setIsSavingHistory] = useState(false);
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
  const hasExerciseHistoryReset = Boolean(
    settings.exerciseHistory.resetCutoffs[exercise.id]
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

  const updateExerciseHistoryReset = async (enabled: boolean) => {
    setIsSavingHistory(true);
    setHistoryMessage(null);
    setHistoryError(null);

    try {
      const nextResetCutoffs = {
        ...settings.exerciseHistory.resetCutoffs,
      };

      if (enabled) {
        nextResetCutoffs[exercise.id] = new Date().toISOString();
      } else {
        delete nextResetCutoffs[exercise.id];
      }

      await saveSettings({
        ...settings,
        exerciseHistory: {
          ...settings.exerciseHistory,
          resetCutoffs: nextResetCutoffs,
        },
      });

      setHistoryMessage(
        enabled
          ? "Future recommendations will ignore older logs for this exercise."
          : "Older logs can guide this exercise again."
      );
    } catch (error) {
      setHistoryError(
        error instanceof Error
          ? error.message
          : "We could not update this exercise history setting."
      );
    } finally {
      setIsSavingHistory(false);
    }
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
            <h1>{getExerciseDisplayName(exercise)}</h1>
            <span>
              {formatExerciseMetadataLabel(exercise.movementPattern)} •{" "}
              {formatExerciseMetadataLabel(exercise.equipmentType)} •{" "}
              {formatExerciseMetadataLabel(exercise.difficulty ?? "beginner")}
            </span>
          </div>
          {/* <Dumbbell aria-hidden="true" /> */}
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

        <section className={styles.historyControlPanel}>
          <div>
            <h2>Exercise history</h2>
            <p>
              Resetting history keeps your logged workouts, but future
              recommendations will ignore older logs for this exercise.
            </p>
          </div>
          <Button
            disabled={isSavingHistory}
            label={
              hasExerciseHistoryReset
                ? "Use older logs again"
                : "Reset recommendation history"
            }
            loading={isSavingHistory}
            size="medium"
            tone={hasExerciseHistoryReset ? "gray" : "secondary"}
            variant={hasExerciseHistoryReset ? "outline" : undefined}
            onClick={() => updateExerciseHistoryReset(!hasExerciseHistoryReset)}
          />
          {historyMessage ? (
            <InlineStatus tone="success" title={historyMessage} />
          ) : null}
          {historyError ? (
            <InlineStatus
              tone="error"
              title="History setting not saved"
              message={historyError}
            />
          ) : null}
        </section>

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

            <ExerciseDetailSection title="Setup" items={description.setup} />
            <ExerciseDetailSection
              title="How to perform"
              items={description.execution}
            />
            <ExerciseDetailSection
              title="Coaching cues"
              items={description.coachingCues}
            />
            <ExerciseDetailSection
              title="Common mistakes"
              items={description.commonMistakes}
            />
            <ExerciseDetailSection
              title="Safety notes"
              items={description.safetyNotes}
            />

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
