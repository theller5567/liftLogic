import clsx from "clsx";
import { Navigate } from "react-router-dom";

import { readSubmittedAnswers } from "../utils/workoutStorage";
import pageStyles from "../styles/pages/page.module.scss";

const Dashboard = () => {
  const submittedAnswers = readSubmittedAnswers();

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
