export const formatWorkoutDisplayLabel = (label: string) =>
  label
    .replace(/^Upper(?!\s+Body\b)/, "Upper Body")
    .replace(/^Lower(?!\s+Body\b)/, "Lower Body");
