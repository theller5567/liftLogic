import { useEffect, useState } from "react";

import {
  getCurrentProfile,
  isApiEnabled,
  type UserProfileDto,
  type WorkoutPlanDto,
} from "../services/api";
import {
  readSubmittedAnswers,
  readWorkoutReviewed,
} from "./workoutStorage";

export type UserFlowDestination = "/onboarding" | "/workout-review" | "/dashboard";

type UserFlowState = {
  destination: UserFlowDestination | null;
  error: Error | null;
  isLoading: boolean;
  profile: UserProfileDto | null;
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
  const [state, setState] = useState<UserFlowState>({
    destination: null,
    error: null,
    isLoading: enabled,
    profile: null,
    workoutPlan: null,
  });

  useEffect(() => {
    if (!enabled) {
      setState({
        destination: null,
        error: null,
        isLoading: false,
        profile: null,
        workoutPlan: null,
      });
      return;
    }

    if (!isApiEnabled()) {
      setState({
        destination: getLocalUserFlowDestination(),
        error: null,
        isLoading: false,
        profile: null,
        workoutPlan: null,
      });
      return;
    }

    let isCurrent = true;

    setState((currentState) => ({
      ...currentState,
      error: null,
      isLoading: true,
    }));

    getCurrentProfile()
      .then(({ profile, workoutPlan }) => {
        if (!isCurrent) {
          return;
        }

        setState({
          destination: getUserFlowDestination(workoutPlan),
          error: null,
          isLoading: false,
          profile,
          workoutPlan,
        });
      })
      .catch((error) => {
        console.error("Failed to load user flow from API", error);

        if (isCurrent) {
          setState({
            destination: null,
            error: error instanceof Error ? error : new Error("Failed to load user flow."),
            isLoading: false,
            profile: null,
            workoutPlan: null,
          });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [enabled]);

  return state;
};
