import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { getCurrentWorkoutPlan, isApiEnabled } from "../services/api";
import {
  readSubmittedAnswers,
  readWorkoutReviewed,
} from "../utils/workoutStorage";

type HomeDestination = "/onboarding" | "/workout-review" | "/dashboard" | null;

const getLocalDestination = (): Exclude<HomeDestination, null> => {
  const submittedAnswers = readSubmittedAnswers();

  if (!submittedAnswers) {
    return "/onboarding";
  }

  if (readWorkoutReviewed()) {
    return "/dashboard";
  }

  return "/workout-review";
};

const Home = () => {
  const [destination, setDestination] = useState<HomeDestination>(() =>
    isApiEnabled() ? null : getLocalDestination()
  );

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

        if (!workoutPlan) {
          setDestination("/onboarding");
          return;
        }

        setDestination(
          workoutPlan.workoutReviewed ? "/dashboard" : "/workout-review"
        );
      })
      .catch((error) => {
        console.error("Failed to load workout plan from API", error);

        if (isCurrent) {
          setDestination(getLocalDestination());
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  if (!destination) {
    return <p className="text-muted">Loading...</p>;
  }

  return <Navigate to={destination} replace />;
};

export default Home;
