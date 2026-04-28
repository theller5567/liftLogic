import { useEffect, useState } from "react";
import clsx from "clsx";
import { Navigate } from "react-router-dom";

import {
  getCurrentWorkoutPlan,
  isApiEnabled,
  type WorkoutPlanDto,
} from "../services/api";
import { readSubmittedAnswers } from "../utils/workoutStorage";
import pageStyles from "../styles/pages/page.module.scss";

const Dashboard = () => {
  const [remoteWorkoutPlan, setRemoteWorkoutPlan] =
    useState<WorkoutPlanDto | null>(null);
  const [hasLoadedRemotePlan, setHasLoadedRemotePlan] = useState(!isApiEnabled());
  const submittedAnswers = remoteWorkoutPlan?.onboardingAnswers ?? readSubmittedAnswers();

  useEffect(() => {
    if (!isApiEnabled()) {
      return;
    }

    let isCurrent = true;

    getCurrentWorkoutPlan()
      .then(({ workoutPlan }) => {
        if (!isCurrent) {
          return;
        }

        setRemoteWorkoutPlan(workoutPlan);
        setHasLoadedRemotePlan(true);
      })
      .catch((error) => {
        console.error("Failed to load dashboard workout plan from API", error);

        if (isCurrent) {
          setHasLoadedRemotePlan(true);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  if (!hasLoadedRemotePlan) {
    return <p className="text-muted">Loading dashboard...</p>;
  }

  if (!submittedAnswers) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <section className={clsx(pageStyles.shell, pageStyles.panel, "grid gap-3 border-panel")}>
      <p className={pageStyles.eyebrow}>
        Dashboard
      </p>
      <h1 className={pageStyles.title}>Your training dashboard is coming soon.</h1>
      <p className="text-muted">
        Your onboarding answers and workout review have been saved.
      </p>
    </section>
  );
};

export default Dashboard;
