import { describe, expect, it } from "vitest";

import type { WorkoutSessionDto } from "../../../shared/types/workoutSession.types";
import type { GeneratedWorkoutPreview } from "./generateWorkoutPreview";
import {
  applyWorkoutPreviewFeasibilityAdjustments,
  buildWorkoutPreviewFeasibilityAudit,
} from "./workoutPreviewFeasibilityAudit";

const createPreview = ({
  reps,
  sets,
  suggestedWeight,
}: {
  reps: string;
  sets: number;
  suggestedWeight: number;
}): GeneratedWorkoutPreview => ({
  days: [
    {
      exercises: [
        {
          exerciseAlternatives: [],
          exerciseId: "barbell_bench_press",
          id: "bench-slot",
          label: "Bench Press",
          prescription: {
            reps,
            restSeconds: 120,
            sets,
          },
          suggestedWeight,
          weightUnit: "lb",
        },
      ],
      focus: "Chest",
      id: "chest-day",
      label: "Chest",
    },
  ],
  daysPerWeek: 4,
  equipmentAccess: ["full_gym"],
  goal: "hypertrophy",
  label: "Hypertrophy",
  level: ["intermediate"],
  programId: "hypertrophy",
  weightUnit: "lb",
});

const createCompletedBenchSession = ({
  reps,
  scheduledFor,
  weight,
}: {
  reps: number;
  scheduledFor: string;
  weight: number;
}): WorkoutSessionDto =>
  ({
    _id: `session-${scheduledFor}`,
    completedAt: scheduledFor,
    exerciseLogs: [
      {
        badgeIds: [],
        completed: true,
        exerciseId: "barbell_bench_press",
        label: "Bench Press",
        plannedExerciseId: "barbell_bench_press",
        plannedLabel: "Bench Press",
        prescriptionSnapshot: {
          reps: String(reps),
          restSeconds: 180,
          sets: 3,
          suggestedWeight: weight,
          weightUnit: "lb",
        },
        sets: Array.from({ length: 3 }, (_, index) => ({
          actualReps: reps,
          completed: true,
          setNumber: index + 1,
          targetReps: String(reps),
          weight,
          weightUnit: "lb",
        })),
        slotId: "bench-slot",
        wasSubstituted: false,
      },
    ],
    programDayLabel: "Strength",
    scheduledFor,
    status: "completed",
  }) as unknown as WorkoutSessionDto;

describe("workout preview feasibility audit", () => {
  it("flags a carried-over 3x5 load when the new program prescribes 4x12", () => {
    const audit = buildWorkoutPreviewFeasibilityAudit({
      preview: createPreview({
        reps: "8-12",
        sets: 4,
        suggestedWeight: 185,
      }),
      workoutSessions: [
        createCompletedBenchSession({
          reps: 5,
          scheduledFor: "2026-07-01T12:00:00.000Z",
          weight: 185,
        }),
      ],
    });

    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({
      exerciseId: "barbell_bench_press",
      exerciseLabel: "Bench Press",
    });
    expect(audit[0].feasibility.status).toBe("too_heavy");
    expect(audit[0].feasibility.suggestedWeight).toBeLessThan(185);
  });

  it("does not flag strength prescriptions that still match recent capacity", () => {
    const audit = buildWorkoutPreviewFeasibilityAudit({
      preview: createPreview({
        reps: "3-5",
        sets: 3,
        suggestedWeight: 175,
      }),
      workoutSessions: [
        createCompletedBenchSession({
          reps: 5,
          scheduledFor: "2026-07-01T12:00:00.000Z",
          weight: 185,
        }),
      ],
    });

    expect(audit).toEqual([]);
  });

  it("quietly lowers too-heavy preview weights to feasible suggestions", () => {
    const { adjustments, preview } = applyWorkoutPreviewFeasibilityAdjustments({
      preview: createPreview({
        reps: "8-12",
        sets: 4,
        suggestedWeight: 185,
      }),
      workoutSessions: [
        createCompletedBenchSession({
          reps: 5,
          scheduledFor: "2026-07-01T12:00:00.000Z",
          weight: 185,
        }),
      ],
    });

    expect(adjustments).toHaveLength(1);
    expect(adjustments[0].originalWeight).toBe(185);
    expect(preview.days[0].exercises[0].suggestedWeight).toBeLessThan(185);
    expect(preview.days[0].exercises[0].suggestedWeight).toBe(
      adjustments[0].adjustedWeight
    );
  });

  it("keeps first-review audit quiet until the user edits above baseline", () => {
    const basePreview = createPreview({
      reps: "8-12",
      sets: 4,
      suggestedWeight: 185,
    });
    const sessions = [
      createCompletedBenchSession({
        reps: 5,
        scheduledFor: "2026-07-01T12:00:00.000Z",
        weight: 185,
      }),
    ];
    const adjustedPreview = applyWorkoutPreviewFeasibilityAdjustments({
      preview: basePreview,
      workoutSessions: sessions,
    }).preview;
    const quietAudit = buildWorkoutPreviewFeasibilityAudit({
      baselinePreview: adjustedPreview,
      preview: adjustedPreview,
      workoutSessions: sessions,
    });
    const userEditedPreview = {
      ...adjustedPreview,
      days: adjustedPreview.days.map((day) => ({
        ...day,
        exercises: day.exercises.map((exercise) => ({
          ...exercise,
          suggestedWeight: 185,
        })),
      })),
    };
    const editedAudit = buildWorkoutPreviewFeasibilityAudit({
      baselinePreview: adjustedPreview,
      preview: userEditedPreview,
      workoutSessions: sessions,
    });

    expect(quietAudit).toEqual([]);
    expect(editedAudit).toHaveLength(1);
    expect(editedAudit[0].feasibility.status).toBe("too_heavy");
  });
});
