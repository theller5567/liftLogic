import { Navigate } from "react-router-dom";

import { readSubmittedAnswers } from "../utils/workoutStorage";

const Dashboard = () => {
  const submittedAnswers = readSubmittedAnswers();

  if (!submittedAnswers) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <section
      style={{
        width: "min(100%, 64rem)",
        display: "grid",
        gap: "0.75rem",
        padding: "1.5rem",
        borderRadius: "1rem",
        background: "hsl(var(--clr-neutral-800-b))",
        border: "1px solid hsl(var(--clr-neutral-600-b) / 0.35)",
      }}
    >
      <p
        style={{
          margin: 0,
          color: "hsl(var(--clr-neutral-100-b))",
          fontSize: "0.85rem",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        Dashboard
      </p>
      <h1 style={{ margin: 0 }}>Your training dashboard is coming soon.</h1>
      <p style={{ margin: 0, color: "hsl(var(--clr-neutral-100-b))" }}>
        Your onboarding answers and workout review have been saved.
      </p>
    </section>
  );
};

export default Dashboard;
