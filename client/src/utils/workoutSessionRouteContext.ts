import { useOutletContext } from "react-router-dom";

import type { WorkoutSessionDto } from "../../../shared/types/workoutSession.types";

export type WorkoutSessionRouteContext = {
  priorSessions: WorkoutSessionDto[];
  session: WorkoutSessionDto;
  setSession: (session: WorkoutSessionDto) => void;
};

export const useWorkoutSessionRouteContext = () =>
  useOutletContext<WorkoutSessionRouteContext>();
