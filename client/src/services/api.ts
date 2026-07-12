import type { OnboardingAnswers } from "../../../shared/types/onboarding.types";
import type {
  WorkoutBadgeId,
  WorkoutExerciseLog,
  WorkoutSessionDto,
} from "../../../shared/types/workoutSession.types";
import type { UserSettings } from "../../../shared/types/userSettings.types";
import type {
  WorkoutFocusArea,
  WorkoutFocusBlock,
} from "../../../shared/types/workoutFocus.types";
import type { GeneratedWorkoutPreview } from "../../../shared/utils/generateWorkoutPreview";

const CLIENT_ID_KEY = "liftlogic:client-id";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)
  ?.replace(/\/$/, "");
let authTokenProvider: (() => Promise<string>) | null = null;
let authExpiredHandler: ((error: ApiError) => void | Promise<void>) | null = null;

export class ApiError extends Error {
  code?: string;
  status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export const AUTH_EXPIRED_CODES = [
  "INVALID_FIREBASE_TOKEN",
  "TOKEN_REFRESH_FAILED",
] as const;

export const isAuthSessionExpiredError = (error: unknown) =>
  error instanceof ApiError &&
  error.status === 401 &&
  AUTH_EXPIRED_CODES.includes(
    error.code as (typeof AUTH_EXPIRED_CODES)[number]
  );

export type WorkoutPlanDto = {
  _id: string;
  clientId: string;
  onboardingAnswers: OnboardingAnswers;
  suggestedPreview: GeneratedWorkoutPreview;
  editedPreview?: GeneratedWorkoutPreview | null;
  focusBlock?: WorkoutFocusBlock | null;
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
  email?: string;
  emailVerified?: boolean;
  photoUrl?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type UserSettingsDto = UserSettings & {
  _id?: string;
  clientId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const isApiEnabled = () => Boolean(API_BASE_URL);

export const setAuthTokenProvider = (
  provider: (() => Promise<string>) | null
) => {
  authTokenProvider = provider;
};

export const setAuthExpiredHandler = (
  handler: ((error: ApiError) => void | Promise<void>) | null
) => {
  authExpiredHandler = handler;
};

const notifyAuthExpired = (error: ApiError) => {
  if (!isAuthSessionExpiredError(error)) {
    return;
  }

  void authExpiredHandler?.(error);
};

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

  const makeRequest = async (authToken: string | null) => fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(authToken
        ? { Authorization: `Bearer ${authToken}` }
        : { "x-liftlogic-client-id": getLiftLogicClientId() }),
      ...options.headers,
    },
  });

  let authToken: string | null = null;

  if (authTokenProvider) {
    try {
      authToken = await authTokenProvider();
    } catch (tokenError) {
      const apiError = new ApiError(
        tokenError instanceof Error
          ? tokenError.message
          : "Could not refresh your auth session.",
        401,
        "TOKEN_REFRESH_FAILED"
      );
      notifyAuthExpired(apiError);
      throw apiError;
    }
  }

  const response = await makeRequest(authToken);

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const apiError = new ApiError(
      errorBody?.error ?? `API request failed: ${response.status}`,
      response.status,
      errorBody?.code
    );

    notifyAuthExpired(apiError);
    throw apiError;
  }

  return (await response.json()) as TResponse;
}

export const getCurrentProfile = () =>
  apiRequest<{
    profile: UserProfileDto;
    workoutPlan: WorkoutPlanDto | null;
    userSettings: UserSettingsDto;
  }>("/api/profile/current");

export const submitOnboardingAnswers = (answers: OnboardingAnswers) =>
  apiRequest<{
    profile: UserProfileDto;
    workoutPlan: WorkoutPlanDto;
  }>("/api/profile/onboarding", {
    method: "PUT",
    body: JSON.stringify({ answers }),
  });

export const saveUserSettings = (settings: UserSettings) =>
  apiRequest<{ userSettings: UserSettingsDto }>("/api/profile/settings", {
    method: "PUT",
    body: JSON.stringify({ settings }),
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

export const saveWorkoutFocusBlock = ({
  durationWeeks,
  focusArea,
  reviewedPreview,
}: {
  durationWeeks: WorkoutFocusBlock["durationWeeks"];
  focusArea: WorkoutFocusArea;
  reviewedPreview?: GeneratedWorkoutPreview;
}) =>
  apiRequest<{ workoutPlan: WorkoutPlanDto }>("/api/workout-plan/focus", {
    method: "PUT",
    body: JSON.stringify({ durationWeeks, focusArea, reviewedPreview }),
  });

export const clearWorkoutFocusBlock = () =>
  apiRequest<{ workoutPlan: WorkoutPlanDto }>("/api/workout-plan/focus", {
    method: "DELETE",
  });

export type CreateWorkoutSessionInput = {
  programDayId: string;
  scheduledFor: string;
  startedAt?: string;
};

export type UpdateWorkoutSessionInput = {
  scheduledFor?: string;
  startedAt?: string;
  notes?: string | null;
  badgeIds?: WorkoutBadgeId[];
  durationSeconds?: number;
  exerciseLogs?: WorkoutExerciseLog[];
  status?: "in_progress" | "abandoned";
};

export type CompleteWorkoutSessionInput = {
  completedAt?: string;
  notes?: string | null;
  badgeIds?: WorkoutBadgeId[];
  durationSeconds?: number;
  exerciseLogs?: WorkoutExerciseLog[];
};

export type WorkoutSessionQuery = {
  dateFrom?: string;
  dateTo?: string;
  status?: "in_progress" | "completed" | "abandoned";
};

const buildWorkoutSessionQuery = (query: WorkoutSessionQuery = {}) => {
  const params = new URLSearchParams();

  if (query.dateFrom) {
    params.set("dateFrom", query.dateFrom);
  }

  if (query.dateTo) {
    params.set("dateTo", query.dateTo);
  }

  if (query.status) {
    params.set("status", query.status);
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

export const createWorkoutSession = (input: CreateWorkoutSessionInput) =>
  apiRequest<{ workoutSession: WorkoutSessionDto }>("/api/workout-sessions", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const getWorkoutSessions = (query?: WorkoutSessionQuery) =>
  apiRequest<{ workoutSessions: WorkoutSessionDto[] }>(
    `/api/workout-sessions${buildWorkoutSessionQuery(query)}`
  );

export const getWorkoutSession = (sessionId: string) =>
  apiRequest<{ workoutSession: WorkoutSessionDto }>(
    `/api/workout-sessions/${sessionId}`
  );

export const updateWorkoutSession = (
  sessionId: string,
  input: UpdateWorkoutSessionInput
) =>
  apiRequest<{ workoutSession: WorkoutSessionDto }>(
    `/api/workout-sessions/${sessionId}`,
    {
      method: "PUT",
      body: JSON.stringify(input),
    }
  );

export const completeWorkoutSession = (
  sessionId: string,
  input: CompleteWorkoutSessionInput = {}
) =>
  apiRequest<{ workoutSession: WorkoutSessionDto }>(
    `/api/workout-sessions/${sessionId}/complete`,
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
