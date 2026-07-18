import { describe, expect, it } from "vitest";

import type { WorkoutExerciseLog } from "../../../shared/types/workoutSession.types";
import {
  areAllWorkoutExercisesCompleted,
  getCompletedExerciseCount,
  getCompletedSetCount,
  getNextIncompleteExerciseIndex,
  getTotalSetCount,
  getWorkoutCompletionPercentage,
} from "./workoutSessionStats";

const createExerciseLog = (
  completed: boolean,
  setCompletion: boolean[] = []
): WorkoutExerciseLog => ({
  badgeIds: [],
  completed,
  exerciseId: "bench_press",
  label: "Bench Press",
  notes: undefined,
  plannedExerciseId: "bench_press",
  plannedLabel: "Bench Press",
  prescriptionSnapshot: {
    reps: "8-10",
    restSeconds: 90,
    sets: setCompletion.length,
    suggestedWeight: 135,
    weightUnit: "lb",
  },
  sets: setCompletion.map((isSetCompleted, index) => ({
    actualReps: isSetCompleted ? 10 : undefined,
    completed: isSetCompleted,
    setNumber: index + 1,
    targetReps: "8-10",
    weight: 135,
    weightUnit: "lb",
  })),
  slotId: `slot-${completed ? "completed" : "open"}-${setCompletion.length}`,
  wasSubstituted: false,
});

describe("workout session stats", () => {
  it("calculates exercise completion stats", () => {
    const exerciseLogs = [
      createExerciseLog(true),
      createExerciseLog(false),
      createExerciseLog(true),
    ];

    expect(getCompletedExerciseCount(exerciseLogs)).toBe(2);
    expect(getWorkoutCompletionPercentage(exerciseLogs)).toBe(67);
    expect(getNextIncompleteExerciseIndex(exerciseLogs)).toBe(1);
    expect(areAllWorkoutExercisesCompleted(exerciseLogs)).toBe(false);
  });

  it("treats empty workouts as 0% complete instead of complete", () => {
    expect(getWorkoutCompletionPercentage([])).toBe(0);
    expect(areAllWorkoutExercisesCompleted([])).toBe(false);
    expect(getNextIncompleteExerciseIndex([])).toBe(-1);
  });

  it("counts completed and total sets across exercises", () => {
    const exerciseLogs = [
      createExerciseLog(true, [true, true, false]),
      createExerciseLog(false, [true, false]),
    ];

    expect(getCompletedSetCount(exerciseLogs)).toBe(3);
    expect(getTotalSetCount(exerciseLogs)).toBe(5);
  });
});
