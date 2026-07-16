import { useEffect, useState } from "react";

import {
  isApiEnabled,
  type UserProfileDto,
  type WorkoutPlanDto,
} from "../services/api";
import {
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
          workoutPlan,
        });
      })
      .catch((error) => {
        console.error("Failed to load user flow from API", error);

        if (isCurrent) {
          setState((currentState) => ({
            ...currentState,
            error: currentState.hasCachedData
              ? null
              : error instanceof Error
                ? error
                : new Error("Failed to load user flow."),
            isLoading: false,
            isRefreshing: false,
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
      if (document.visibilityState === "visible") {
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
      workoutPlan: null,
    };
  }

  return state;
};
