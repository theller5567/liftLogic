import type { WorkoutSessionDto } from "../../../shared/types/workoutSession.types";
import type { UserMessage } from "./userMessages";

export type MessageExerciseActionTarget = {
  exerciseId: string;
  exerciseIndex: number;
  exerciseLabel: string;
  openAdjustmentSheet?: boolean;
  sessionId: string;
  sessionLabel: string;
  to: string;
};

export type MessageExerciseActionResolution = {
  actionLabel: "Adjust load" | "Review exercise" | "Review exercises";
  targets: MessageExerciseActionTarget[];
};

const getSourceExerciseIds = (message: UserMessage) =>
  message.lifecycle?.sourceExerciseIds ?? [];

export const resolveMessageExerciseAction = (
  message: UserMessage,
  sessions: WorkoutSessionDto[]
): MessageExerciseActionResolution | null => {
  const sourceExerciseIds = new Set(getSourceExerciseIds(message));

  if (
    sourceExerciseIds.size === 0 ||
    message.category !== "progressive_overload"
  ) {
    return null;
  }

  const targets = sessions
    .filter((session) => session.status === "in_progress")
    .flatMap((session) =>
      session.exerciseLogs.flatMap((exerciseLog, exerciseIndex) =>
        sourceExerciseIds.has(exerciseLog.exerciseId)
          ? [
              {
                exerciseId: exerciseLog.exerciseId,
                exerciseIndex,
                exerciseLabel: exerciseLog.label,
                openAdjustmentSheet: message.id === "progression-reduce-or-modify",
                sessionId: session._id,
                sessionLabel: session.programDayLabel,
                to: `/workout/${session._id}/exercise/${exerciseIndex}`,
              },
            ]
          : []
      )
    );

  if (targets.length === 0) {
    return null;
  }

  return {
    actionLabel:
      targets.length > 1
        ? "Review exercises"
        : message.id === "progression-reduce-or-modify"
          ? "Adjust load"
          : "Review exercise",
    targets,
  };
};
