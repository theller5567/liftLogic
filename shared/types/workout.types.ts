export type WorkoutType =
  | "upper_body"
  | "lower_body"
  | "push"
  | "pull"
  | "legs"
  | "full_body"
  | "custom";

export interface WorkoutTemplate {
  id: string;
  name: string;
  workoutType: WorkoutType;
}
