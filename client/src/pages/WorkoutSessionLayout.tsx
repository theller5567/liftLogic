import { useEffect, useState } from "react";
import {
  Navigate,
  Outlet,
  useNavigate,
  useParams,
} from "react-router-dom";

import AppShell from "../components/app/AppShell";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import { getWorkoutSession, getWorkoutSessions } from "../services/api";
import type { WorkoutSessionDto } from "../../../shared/types/workoutSession.types";
import { getStartOfWeek } from "../utils/workoutSessionDates";
import styles from "../styles/pages/workout.module.scss";

const WorkoutSessionLayout = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<WorkoutSessionDto | null>(null);
  const [priorSessions, setPriorSessions] = useState<WorkoutSessionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    let isMounted = true;

    const loadWorkout = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { workoutSession } = await getWorkoutSession(sessionId);
        const currentWeekStart = getStartOfWeek(
          new Date(workoutSession.scheduledFor)
        );
        const { workoutSessions } = await getWorkoutSessions({
          dateTo: currentWeekStart.toISOString(),
          status: "completed",
        });

        if (!isMounted) {
          return;
        }

        setSession(workoutSession);
        setPriorSessions(workoutSessions);
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "We could not load this workout."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadWorkout();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  if (!sessionId) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen label="Loading workout..." />;
  }

  if (error || !session) {
    return (
      <AppShell>
        <section className={styles.workout}>
          <p className="text-muted">
            {error ?? "We could not load this workout."}
          </p>
          <Button label="Back to dashboard" onClick={() => navigate("/dashboard")} />
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Outlet context={{ priorSessions, session, setSession }} />
    </AppShell>
  );
};

export default WorkoutSessionLayout;
