import type { OnboardingAnswers } from "../../../shared/types/onboarding.types";
import type { GeneratedWorkoutPreview } from "../../../shared/utils/generateWorkoutPreview";

const CLIENT_ID_KEY = "liftlogic:client-id";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)
  ?.replace(/\/$/, "");

export type WorkoutPlanDto = {
  _id: string;
  clientId: string;
  onboardingAnswers: OnboardingAnswers;
  suggestedPreview: GeneratedWorkoutPreview;
  editedPreview?: GeneratedWorkoutPreview | null;
  workoutReviewed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserProfileDto = {
  _id: string;
  clientId: string;
  displayName?: string;
  authProvider?: "anonymous" | "firebase";
  authUserId?: string;
  createdAt: string;
  updatedAt: string;
};

export const isApiEnabled = () => Boolean(API_BASE_URL);

const createClientId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `client_${Date.now()}_${Math.random().toString(36).slice(2)}`;
};

export const getLiftLogicClientId = () => {
  const existingClientId = window.localStorage.getItem(CLIENT_ID_KEY);

  if (existingClientId) {
    return existingClientId;
  }

  const nextClientId = createClientId();
  window.localStorage.setItem(CLIENT_ID_KEY, nextClientId);
  return nextClientId;
};

async function apiRequest<TResponse>(
  path: string,
  options: RequestInit = {}
): Promise<TResponse> {
  if (!API_BASE_URL) {
    throw new Error("VITE_API_BASE_URL is not configured.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-liftlogic-client-id": getLiftLogicClientId(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error ?? `API request failed: ${response.status}`);
  }

  return (await response.json()) as TResponse;
}

export const getCurrentProfile = () =>
  apiRequest<{
    profile: UserProfileDto;
    workoutPlan: WorkoutPlanDto | null;
  }>("/api/profile/current");

export const submitOnboardingAnswers = (answers: OnboardingAnswers) =>
  apiRequest<{
    profile: UserProfileDto;
    workoutPlan: WorkoutPlanDto;
  }>("/api/profile/onboarding", {
    method: "PUT",
    body: JSON.stringify({ answers }),
  });

export const getCurrentWorkoutPlan = () =>
  apiRequest<{ workoutPlan: WorkoutPlanDto | null }>("/api/workout-plan/current");

export const saveEditedWorkoutPreview = (
  editedPreview: GeneratedWorkoutPreview
) =>
  apiRequest<{ workoutPlan: WorkoutPlanDto }>("/api/workout-plan/current", {
    method: "PUT",
    body: JSON.stringify({ editedPreview }),
  });

export const markWorkoutPlanReviewed = () =>
  apiRequest<{ workoutPlan: WorkoutPlanDto }>("/api/workout-plan/review", {
    method: "POST",
  });
