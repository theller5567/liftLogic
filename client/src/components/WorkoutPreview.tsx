import Button from "./Button";
import type { GeneratedWorkoutPreview } from "../utils/generateWorkoutPreview";

type WorkoutPreviewProps = {
  preview: GeneratedWorkoutPreview;
  onStartOver: () => void;
};

const formatRestLabel = (restSeconds: number) => {
  const minutes = Math.floor(restSeconds / 60);
  const seconds = restSeconds % 60;

  if (minutes > 0 && seconds > 0) {
    return `${minutes}m ${seconds}s rest`;
  }

  if (minutes > 0) {
    return `${minutes}m rest`;
  }

  return `${seconds}s rest`;
};

const WorkoutPreview = ({ preview, onStartOver }: WorkoutPreviewProps) => {
  console.log("Preview data:", preview);
  return (
    <section
      style={{
        width: "min(100%, 64rem)",
        display: "grid",
        gap: "1.5rem",
      }}
    >
      <header
        style={{
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
          Starter Program Preview
        </p>
        <h1 style={{ margin: 0 }}>{preview.label}</h1>
        <p style={{ margin: 0, color: "hsl(var(--clr-neutral-100-b))" }}>
          {preview.daysPerWeek} days per week • Goal: {preview.goal} • Unit: {preview.weightUnit}
        </p>
        <div>
          <Button
            type="button"
            label="Start over"
            tone="gray"
            variant="outline"
            onClick={onStartOver}
          />
        </div>
      </header>

      <div style={{ display: "grid", gap: "1rem" }}>
        {preview.days.map((day) => (
          <section
            key={day.id}
            style={{
              display: "grid",
              gap: "1rem",
              padding: "1.25rem",
              borderRadius: "1rem",
              background: "hsl(var(--clr-neutral-800-b))",
              border: "1px solid hsl(var(--clr-neutral-600-b) / 0.35)",
            }}
          >
            <header style={{ display: "grid", gap: "0.25rem" }}>
              <h2 style={{ margin: 0 }}>{day.label}</h2>
              <p style={{ margin: 0, color: "hsl(var(--clr-neutral-100-b))" }}>
                {day.focus}
              </p>
            </header>

            <div style={{ display: "grid", gap: "0.75rem" }}>
              {day.exercises.map((exercise) => (
                <article
                  key={exercise.id}
                  style={{
                    display: "grid",
                    gap: "0.45rem",
                    padding: "1rem",
                    borderRadius: "0.85rem",
                    background: "hsl(var(--clr-neutral-900-b) / 0.45)",
                    border: "1px solid hsl(var(--clr-neutral-600-b) / 0.25)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "1rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <strong>{exercise.label}</strong>
                    {exercise.suggestedWeight !== undefined ? (
                      <span style={{ color: "hsl(var(--clr-primary-500-b))", fontWeight: 700 }}>
                        Start at {exercise.suggestedWeight} {exercise.weightUnit}
                      </span>
                    ) : null}
                  </div>
                  <p style={{ margin: 0, color: "hsl(var(--clr-neutral-100-b))" }}>
                    {exercise.prescription.sets} sets • {exercise.prescription.reps} reps •{" "}
                    {formatRestLabel(exercise.prescription.restSeconds)}
                  </p>
                  {exercise.notes ? (
                    <p style={{ margin: 0, color: "hsl(var(--clr-neutral-100-b))" }}>
                      {exercise.notes}
                    </p>
                  ) : null}
                  {exercise.exerciseAlternatives.length > 0 ? (
                    <div style={{ display: "grid", gap: "0.35rem" }}>
                      <p
                        style={{
                          margin: 0,
                          color: "hsl(var(--clr-neutral-100-b))",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                        }}
                      >
                        Alternatives
                      </p>
                      <div style={{ display: "grid", gap: "0.25rem" }}>
                        {exercise.exerciseAlternatives.map((alternative) => (
                          <p
                            key={`${exercise.id}-${alternative.exerciseId}`}
                            style={{ margin: 0, color: "hsl(var(--clr-neutral-100-b))" }}
                          >
                            {alternative.label}
                            {alternative.note ? ` — ${alternative.note}` : ""}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
};

export default WorkoutPreview;
