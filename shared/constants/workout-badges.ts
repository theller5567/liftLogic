import type { WorkoutBadgeId } from "../types/workoutSession.types";

export type WorkoutBadgeOption = {
  id: WorkoutBadgeId;
  label: string;
  description: string;
};

export const workoutBadgeOptions = [
  {
    id: "pr",
    label: "PR",
    description: "A personal best or meaningful progress jump.",
  },
  {
    id: "felt_easy",
    label: "Felt easy",
    description: "The target felt easier than expected.",
  },
  {
    id: "felt_hard",
    label: "Felt hard",
    description: "The target was completed but felt difficult.",
  },
  {
    id: "missed_reps",
    label: "Missed reps",
    description: "One or more planned reps were missed.",
  },
  {
    id: "form_issue",
    label: "Improve form",
    description: "Technique needs attention before pushing load.",
  },
  {
    id: "pain",
    label: "Pain",
    description: "Discomfort or pain was noticed.",
  },
  {
    id: "substituted",
    label: "Substituted",
    description: "The movement was swapped or modified.",
  },
] satisfies WorkoutBadgeOption[];
