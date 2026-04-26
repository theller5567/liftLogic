import { Navigate } from "react-router-dom";

import {
  readSubmittedAnswers,
  readWorkoutReviewed,
} from "../utils/workoutStorage";

const Home = () => {
  const submittedAnswers = readSubmittedAnswers();

  if (!submittedAnswers) {
    return <Navigate to="/onboarding" replace />;
  }

  if (readWorkoutReviewed()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/workout-review" replace />;
};

export default Home;
