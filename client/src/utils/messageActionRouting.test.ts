import { describe, expect, it } from "vitest";

import type {
  WorkoutExerciseLog,
  WorkoutSessionDto,
} from "../../../shared/types/workoutSession.types";
import type { UserMessage } from "./userMessages";
import { resolveMessageExerciseAction } from "./messageActionRouting";

const createExerciseLog = ({
  exerciseId,
  label,
}: {
  exerciseId: string;
  label: string;
}): WorkoutExerciseLog =>
  ({
    badgeIds: [],
    completed: false,
    exerciseId,
    label,
    plannedExerciseId: exerciseId,
    plannedLabel: label,
    prescriptionSnapshot: {
      reps: "8-10",
      restSeconds: 120,
      sets: 3,
      suggestedWeight: 100,
      weightUnit: "lb",
    },
    sets: [],
    slotId: `${exerciseId}-slot`,
    wasSubstituted: false,
  }) as WorkoutExerciseLog;

const createSession = ({
  exerciseLogs,
  id = "session-1",
  label = "Upper",
  status = "in_progress",
}: {
  exerciseLogs: WorkoutExerciseLog[];
  id?: string;
  label?: string;
  status?: WorkoutSessionDto["status"];
}): WorkoutSessionDto =>
  ({
    _id: id,
    exerciseLogs,
    programDayLabel: label,
    status,
  }) as WorkoutSessionDto;

const createMessage = (sourceExerciseIds: string[]): UserMessage => ({
  body: "Review these exercises.",
  category: "progressive_overload",
  id: "progression-reduce-or-modify",
  lifecycle: {
    dismissalPolicy: {
      cooldownHours: 24,
      returnWhenChanged: true,
    },
    scope: "exercise_action",
    sourceExerciseIds,
  },
  priority: 45,
  severity: "warning",
  surfaces: ["dashboard"],
  title: "Drop the load or modify",
});

describe("message action routing", () => {
  it("resolves a single active exercise target", () => {
    const resolution = resolveMessageExerciseAction(createMessage(["bench"]), [
      createSession({
        exerciseLogs: [
          createExerciseLog({ exerciseId: "bench", label: "Bench Press" }),
        ],
      }),
    ]);

    expect(resolution).toEqual({
      actionLabel: "Adjust load",
      targets: [
        {
          exerciseId: "bench",
          exerciseIndex: 0,
          exerciseLabel: "Bench Press",
          openAdjustmentSheet: true,
          sessionId: "session-1",
          sessionLabel: "Upper",
          to: "/workout/session-1/exercise/0",
        },
      ],
    });
  });

  it("uses a review label for non-reduce progression messages", () => {
    const message = {
      ...createMessage(["bench"]),
      id: "progression-ready",
      title: "Ready to progress",
    };
    const resolution = resolveMessageExerciseAction(message, [
      createSession({
        exerciseLogs: [
          createExerciseLog({ exerciseId: "bench", label: "Bench Press" }),
        ],
      }),
    ]);

    expect(resolution?.actionLabel).toBe("Review exercise");
    expect(resolution?.targets[0].openAdjustmentSheet).toBe(false);
  });

  it("resolves multiple active exercise targets for chooser flows", () => {
    const resolution = resolveMessageExerciseAction(
      createMessage(["bench", "row"]),
      [
        createSession({
          exerciseLogs: [
            createExerciseLog({ exerciseId: "bench", label: "Bench Press" }),
            createExerciseLog({ exerciseId: "row", label: "Barbell Row" }),
          ],
        }),
      ]
    );

    expect(resolution?.actionLabel).toBe("Review exercises");
    expect(resolution?.targets.map((target) => target.exerciseLabel)).toEqual([
      "Bench Press",
      "Barbell Row",
    ]);
  });

  it("does not create adjustment actions without an in-progress target", () => {
    const resolution = resolveMessageExerciseAction(createMessage(["bench"]), [
      createSession({
        exerciseLogs: [
          createExerciseLog({ exerciseId: "bench", label: "Bench Press" }),
        ],
        status: "completed",
      }),
    ]);

    expect(resolution).toBeNull();
  });
});
