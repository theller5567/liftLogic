import type { OnboardingAnswers } from "../../shared/types/onboarding.types";
import type { GeneratedWorkoutPreview } from "../../shared/utils/generateWorkoutPreview";

type WorkoutPlanDto = {
  onboardingAnswers: OnboardingAnswers;
  suggestedPreview: GeneratedWorkoutPreview;
  editedPreview?: GeneratedWorkoutPreview | null;
  workoutReviewed: boolean;
};

const apiBaseUrl = (process.env.API_BASE_URL ?? "http://localhost:5001").replace(
  /\/$/,
  ""
);
const clientId =
  process.env.SMOKE_CLIENT_ID ?? `smoke-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const sampleAnswers: OnboardingAnswers = {
  goal: "hypertrophy",
  goalPriority: "hypertrophy",
  experienceLevel: "beginner",
  equipmentAccess: "full_gym",
  weightUnit: "lb",
  bodyWeight: 185,
  benchPress: {
    familiarity: "some",
    knowsWorkingWeight: true,
    estimatedWeight: 95,
    estimatedReps: 8,
    confidence: "medium",
  },
  dumbbellRow: {
    familiarity: "some",
    knowsWorkingWeight: true,
    estimatedWeight: 45,
    estimatedReps: 8,
    confidence: "medium",
  },
  squat: {
    familiarity: "some",
    knowsWorkingWeight: true,
    estimatedWeight: 135,
    estimatedReps: 6,
    confidence: "medium",
  },
  barbellDeadlift: {
    familiarity: "some",
    knowsWorkingWeight: true,
    estimatedWeight: 155,
    estimatedReps: 5,
    confidence: "medium",
  },
};

async function request<TResponse>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-liftlogic-client-id": clientId,
      ...options.headers,
    },
  });
  const body = (await response.json().catch(() => null)) as TResponse;

  if (!response.ok) {
    throw new Error(
      `${options.method ?? "GET"} ${path} failed with ${response.status}: ${JSON.stringify(body)}`
    );
  }

  return body;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  console.log(`Smoke testing ${apiBaseUrl}`);
  console.log(`Using client id ${clientId}`);

  const health = await request<{ message: string }>("/api/health", {
    headers: {},
  });
  assert(health.message === "LiftLogic API is running", "Health check failed.");
  console.log("✓ health");

  const profileResult = await request<{
    profile: { clientId: string };
    workoutPlan: WorkoutPlanDto | null;
  }>("/api/profile/current");
  assert(profileResult.profile.clientId === clientId, "Profile clientId mismatch.");
  console.log("✓ profile/current");

  const onboardingResult = await request<{
    workoutPlan: WorkoutPlanDto;
  }>("/api/profile/onboarding", {
    method: "PUT",
    body: JSON.stringify({ answers: sampleAnswers }),
  });
  assert(
    onboardingResult.workoutPlan.suggestedPreview.days.length > 0,
    "Onboarding did not generate workout days."
  );
  console.log("✓ profile/onboarding");

  const currentPlanResult = await request<{ workoutPlan: WorkoutPlanDto | null }>(
    "/api/workout-plan/current"
  );
  assert(currentPlanResult.workoutPlan, "Workout plan was not found after onboarding.");
  console.log("✓ workout-plan/current");

  const editedPreview = {
    ...currentPlanResult.workoutPlan.suggestedPreview,
    days: currentPlanResult.workoutPlan.suggestedPreview.days.map((day, dayIndex) => ({
      ...day,
      exercises: day.exercises.map((exercise, exerciseIndex) =>
        dayIndex === 0 &&
        exerciseIndex === 0 &&
        exercise.suggestedWeight !== undefined
          ? { ...exercise, suggestedWeight: exercise.suggestedWeight + 5 }
          : exercise
      ),
    })),
  };

  const editedResult = await request<{ workoutPlan: WorkoutPlanDto }>(
    "/api/workout-plan/current",
    {
      method: "PUT",
      body: JSON.stringify({ editedPreview }),
    }
  );
  assert(editedResult.workoutPlan.editedPreview, "Edited preview was not saved.");
  console.log("✓ workout-plan/current update");

  const reviewResult = await request<{ workoutPlan: WorkoutPlanDto }>(
    "/api/workout-plan/review",
    { method: "POST" }
  );
  assert(reviewResult.workoutPlan.workoutReviewed, "Workout plan was not reviewed.");
  console.log("✓ workout-plan/review");

  console.log("Smoke test passed.");
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
