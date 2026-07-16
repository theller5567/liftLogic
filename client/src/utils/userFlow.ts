import { useEffect, useState } from "react";

import {
  isApiEnabled,
  type UserProfileDto,
  type WorkoutPlanDto,
} from "../services/api";
import {
  isCachedCurrentAppDataStale,
  readCachedCurrentAppData,
  refreshCurrentAppData,
} from "./appDataCache";
import {
  readSubmittedAnswers,
  readWorkoutReviewed,
} from "./workoutStorage";

export type UserFlowDestination = "/onboarding" | "/workout-review" | "/dashboard";

type UserFlowState = {
  destination: UserFlowDestination | null;
  error: Error | null;
  hasCachedData: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  profile: UserProfileDto | null;
  refresh: () => void;
  refreshError: Error | null;
  workoutPlan: WorkoutPlanDto | null;
};

export const getUserFlowDestination = (
  workoutPlan: WorkoutPlanDto | null
): UserFlowDestination => {
  if (!workoutPlan) {
    return "/onboarding";
  }

  return workoutPlan.workoutReviewed ? "/dashboard" : "/workout-review";
};

export const getLocalUserFlowDestination = (): UserFlowDestination => {
  const submittedAnswers = readSubmittedAnswers();

  if (!submittedAnswers) {
    return "/onboarding";
  }

  return readWorkoutReviewed() ? "/dashboard" : "/workout-review";
};

export const useUserFlow = (enabled = true): UserFlowState => {
  const apiEnabled = isApiEnabled();
  const cachedAppData = apiEnabled ? readCachedCurrentAppData() : null;
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [state, setState] = useState<UserFlowState>({
    destination: cachedAppData
      ? getUserFlowDestination(cachedAppData.workoutPlan)
      : null,
    error: null,
    hasCachedData: Boolean(cachedAppData),
    isLoading: enabled && apiEnabled && !cachedAppData,
    isRefreshing: enabled && apiEnabled && Boolean(cachedAppData),
    profile: cachedAppData?.profile ?? null,
    refresh: () => setRefreshIndex((currentIndex) => currentIndex + 1),
    refreshError: null,
    workoutPlan: cachedAppData?.workoutPlan ?? null,
  });

  useEffect(() => {
    if (!enabled || !apiEnabled) {
      return;
    }

    let isCurrent = true;

    refreshCurrentAppData()
      .then(({ profile, workoutPlan }) => {
        if (!isCurrent) {
          return;
        }

        setState({
          destination: getUserFlowDestination(workoutPlan),
          error: null,
          hasCachedData: true,
          isLoading: false,
          isRefreshing: false,
          profile,
          refresh: () => setRefreshIndex((currentIndex) => currentIndex + 1),
          refreshError: null,
          workoutPlan,
        });
      })
      .catch((error) => {
        console.error("Failed to load user flow from API", error);

        if (isCurrent) {
          const normalizedError =
            error instanceof Error
              ? error
              : new Error("Failed to load user flow.");

          setState((currentState) => ({
            ...currentState,
            error: currentState.hasCachedData ? null : normalizedError,
            isLoading: false,
            isRefreshing: false,
            refreshError: currentState.hasCachedData ? normalizedError : null,
          }));
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [apiEnabled, enabled, refreshIndex]);

  useEffect(() => {
    if (!enabled || !apiEnabled) {
      return;
    }

    const refreshWhenVisible = () => {
      if (
        document.visibilityState === "visible" &&
        isCachedCurrentAppDataStale()
      ) {
        setRefreshIndex((currentIndex) => currentIndex + 1);
      }
    };

    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("focus", refreshWhenVisible);

    return () => {
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("focus", refreshWhenVisible);
    };
  }, [apiEnabled, enabled]);

  if (!enabled) {
    return {
      destination: null,
      error: null,
      hasCachedData: false,
      isLoading: false,
      isRefreshing: false,
      profile: null,
      refresh: () => undefined,
      refreshError: null,
      workoutPlan: null,
    };
  }

  if (!apiEnabled) {
    return {
      destination: getLocalUserFlowDestination(),
      error: null,
      hasCachedData: true,
      isLoading: false,
      isRefreshing: false,
      profile: null,
      refresh: () => undefined,
      refreshError: null,
      workoutPlan: null,
    };
  }

  return state;
};
