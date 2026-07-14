import { z } from "zod";

import type { OnboardingAnswers } from "../../../shared/types/onboarding.types";
import { equipmentItemIds } from "../../../shared/constants/equipmentCatalog";
import type {
  WorkoutBadgeId,
  WorkoutExerciseLog,
  WorkoutSetLog,
} from "../../../shared/types/workoutSession.types";
import type { UserSettings } from "../../../shared/types/userSettings.types";
import {
  WORKOUT_FOCUS_AREAS,
  WORKOUT_FOCUS_DURATION_WEEKS,
  type WorkoutFocusArea,
  type WorkoutFocusBlock,
} from "../../../shared/types/workoutFocus.types";
import type { GeneratedWorkoutPreview } from "../../../shared/utils/generateWorkoutPreview";

const goalSchema = z.enum(["hypertrophy", "strength", "hybrid"]);
const goalPrioritySchema = z.enum(["hypertrophy", "strength"]);
const onboardingModeSchema = z.enum(["guided", "browse"]);
const experienceLevelSchema = z.enum(["beginner", "intermediate", "advanced"]);
const availableTrainingDaysSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);
const genderSchema = z.enum(["male", "female"]);
const ageRangeSchema = z.enum(["7_15", "16_18", "19_29", "30_39", "40_49", "50_plus"]);
const equipmentAccessSchema = z.enum([
  "full_gym",
  "home_gym",
  "dumbbells_only",
  "basic_equipment",
]);
const equipmentItemSchema = z.enum(equipmentItemIds);
const weightUnitSchema = z.enum(["lb", "kg"]);
const workoutBadgeIdSchema = z.enum([
  "pr",
  "missed_reps",
  "form_issue",
  "pain",
  "felt_easy",
  "felt_hard",
  "substituted",
]) satisfies z.ZodType<WorkoutBadgeId>;
const confidenceSchema = z.enum(["high", "medium", "low"]);
const familiaritySchema = z.enum(["never", "some", "often"]);
const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const focusAreaSchema = z.enum(WORKOUT_FOCUS_AREAS) satisfies z.ZodType<WorkoutFocusArea>;
const focusDurationWeeksSchema = z.union(
  WORKOUT_FOCUS_DURATION_WEEKS.map((duration) => z.literal(duration)) as [
    z.ZodLiteral<2>,
    z.ZodLiteral<4>,
    z.ZodLiteral<6>,
    z.ZodLiteral<8>,
  ]
);

const nonNegativeOptionalNumber = z.number().finite().nonnegative().optional();

const anchorAnswerSchema = z
  .object({
    familiarity: familiaritySchema.optional(),
    knowsWorkingWeight: z.boolean().optional(),
    estimatedWeight: nonNegativeOptionalNumber,
    estimatedReps: z.number().finite().int().min(1).max(30).optional(),
    confidence: confidenceSchema.optional(),
  })
  .strict();

export const onboardingAnswersSchema = z
  .object({
    onboardingMode: onboardingModeSchema.optional(),
    selectedWorkoutTemplateId: z.string().min(1).max(160).optional(),
    goal: goalSchema.optional(),
    goalPriority: goalPrioritySchema.optional(),
    experienceLevel: experienceLevelSchema.optional(),
    equipmentAccess: equipmentAccessSchema.optional(),
    availableEquipment: z.array(equipmentItemSchema).max(80).optional(),
    availableTrainingDays: availableTrainingDaysSchema.optional(),
    gender: genderSchema.optional(),
    ageRange: ageRangeSchema.optional(),
    focusArea: focusAreaSchema.optional(),
    focusDurationWeeks: focusDurationWeeksSchema.optional(),
    weightUnit: weightUnitSchema.optional(),
    bodyWeight: nonNegativeOptionalNumber,
    benchPress: anchorAnswerSchema.optional(),
    dumbbellRow: anchorAnswerSchema.optional(),
    squat: anchorAnswerSchema.optional(),
    barbellDeadlift: anchorAnswerSchema.optional(),
  })
  .strict() satisfies z.ZodType<OnboardingAnswers>;

const prescriptionSchema = z
  .object({
    sets: z.number().finite().int().min(1).max(20),
    reps: z.string().min(1).max(80),
    restSeconds: z.number().finite().int().min(0).max(900),
    intensity: z.enum(["easy", "moderate", "hard"]).optional(),
  })
  .strict();

const exerciseAlternativeSchema = z
  .object({
    exerciseId: z.string().min(1).max(120),
    label: z.string().min(1).max(160),
    note: z.string().min(1).max(500).optional(),
  })
  .strict();

const exercisePreviewSchema = z
  .object({
    id: z.string().min(1).max(160),
    exerciseId: z.string().min(1).max(120),
    label: z.string().min(1).max(160),
    prescription: prescriptionSchema,
    suggestedWeight: z.number().finite().nonnegative().optional(),
    weightUnit: weightUnitSchema.optional(),
    notes: z.string().min(1).max(500).optional(),
    detailTags: z.array(z.string().min(1).max(80)).max(8).optional(),
    exerciseAlternatives: z.array(exerciseAlternativeSchema).max(20),
  })
  .strict();

const dayPreviewSchema = z
  .object({
    id: z.string().min(1).max(160),
    label: z.string().min(1).max(160),
    focus: z.string().min(1).max(240),
    exercises: z.array(exercisePreviewSchema).min(1).max(30),
  })
  .strict();

const scheduleDayPreviewSchema = z.discriminatedUnion("type", [
  z
    .object({
      day: z.number().finite().int().min(1).max(7),
      type: z.literal("workout"),
      id: z.string().min(1).max(160),
      label: z.string().min(1).max(160),
      workoutDayId: z.string().min(1).max(160),
    })
    .strict(),
  z
    .object({
      day: z.number().finite().int().min(1).max(7),
      type: z.literal("rest"),
      label: z.string().min(1).max(160),
    })
    .strict(),
]);

export const generatedWorkoutPreviewSchema = z
  .object({
    programId: z.string().min(1).max(160),
    label: z.string().min(1).max(160),
    goal: goalSchema,
    level: z.array(experienceLevelSchema).min(1).max(3),
    equipmentAccess: z.array(equipmentAccessSchema).min(1).max(4),
    daysPerWeek: z.number().finite().int().min(1).max(7),
    weightUnit: weightUnitSchema,
    days: z.array(dayPreviewSchema).min(1).max(7),
    weeklySchedule: z.array(scheduleDayPreviewSchema).min(1).max(7).optional(),
  })
  .strict() satisfies z.ZodType<GeneratedWorkoutPreview>;

export const onboardingSubmissionSchema = z
  .object({
    answers: onboardingAnswersSchema,
  })
  .strict();

const weightStepsSchema = z
  .object({
    default: z.number().finite().positive().max(100),
    barbell: z.number().finite().positive().max(100),
    dumbbell: z.number().finite().positive().max(100),
    machine: z.number().finite().positive().max(100),
    cable: z.number().finite().positive().max(100),
  })
  .strict();

export const userSettingsSchema = z
  .object({
    weightUnit: weightUnitSchema,
    weightSteps: weightStepsSchema,
    restTimer: z
      .object({
        autoStartAfterSet: z.boolean(),
        defaultSeconds: z.number().finite().int().min(0).max(900).optional(),
      })
      .strict(),
    equipmentInventory: z.array(equipmentItemSchema).max(80).optional(),
    theme: z
      .object({
        primaryColor: colorSchema,
        secondaryColor: colorSchema,
      })
      .strict(),
  })
  .strict() satisfies z.ZodType<UserSettings>;

export const userSettingsSubmissionSchema = z
  .object({
    settings: userSettingsSchema,
  })
  .strict();

export const editedWorkoutPreviewSubmissionSchema = z
  .object({
    editedPreview: generatedWorkoutPreviewSchema,
  })
  .strict();

export const workoutFocusBlockSchema = z
  .object({
    focusArea: focusAreaSchema,
    durationWeeks: focusDurationWeeksSchema,
    startedAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    reviewedPreview: generatedWorkoutPreviewSchema.optional(),
  })
  .strict() satisfies z.ZodType<WorkoutFocusBlock>;

export const workoutFocusSubmissionSchema = z
  .object({
    focusArea: focusAreaSchema,
    durationWeeks: focusDurationWeeksSchema,
    reviewedPreview: generatedWorkoutPreviewSchema.optional(),
  })
  .strict();

const workoutSetLogSchema = z
  .object({
    setNumber: z.number().finite().int().min(1).max(50),
    targetReps: z.string().min(1).max(80).optional(),
    actualReps: z.number().finite().int().min(0).max(500).optional(),
    weight: z.number().finite().nonnegative().optional(),
    weightUnit: weightUnitSchema.optional(),
    completed: z.boolean(),
    rpe: z.number().finite().min(0).max(10).optional(),
    rir: z.number().finite().min(0).max(20).optional(),
    notes: z.string().min(1).max(500).optional(),
  })
  .strict() satisfies z.ZodType<WorkoutSetLog>;

const prescriptionSnapshotSchema = prescriptionSchema.extend({
  suggestedWeight: z.number().finite().nonnegative().optional(),
  weightUnit: weightUnitSchema.optional(),
});

const workoutExerciseLogSchema = z
  .object({
    slotId: z.string().min(1).max(160),
    plannedExerciseId: z.string().min(1).max(120),
    plannedLabel: z.string().min(1).max(160),
    exerciseId: z.string().min(1).max(120),
    label: z.string().min(1).max(160),
    wasSubstituted: z.boolean(),
    prescriptionSnapshot: prescriptionSnapshotSchema,
    sets: z.array(workoutSetLogSchema).max(50),
    notes: z.string().min(1).max(1000).optional(),
    badgeIds: z.array(workoutBadgeIdSchema).max(20).default([]),
    completed: z.boolean(),
  })
  .strict() satisfies z.ZodType<WorkoutExerciseLog>;

export const createWorkoutSessionSchema = z
  .object({
    programDayId: z.string().min(1).max(160),
    scheduledFor: z.coerce.date(),
    startedAt: z.coerce.date().optional(),
  })
  .strict();

export const updateWorkoutSessionSchema = z
  .object({
    scheduledFor: z.coerce.date().optional(),
    startedAt: z.coerce.date().optional(),
    notes: z.string().min(1).max(2000).nullable().optional(),
    badgeIds: z.array(workoutBadgeIdSchema).max(20).optional(),
    durationSeconds: z.number().finite().int().nonnegative().optional(),
    exerciseLogs: z.array(workoutExerciseLogSchema).min(1).max(40).optional(),
    status: z.enum(["in_progress", "abandoned"]).optional(),
  })
  .strict();

export const completeWorkoutSessionSchema = z
  .object({
    completedAt: z.coerce.date().optional(),
    notes: z.string().min(1).max(2000).nullable().optional(),
    badgeIds: z.array(workoutBadgeIdSchema).max(20).optional(),
    durationSeconds: z.number().finite().int().nonnegative().optional(),
    exerciseLogs: z.array(workoutExerciseLogSchema).min(1).max(40).optional(),
  })
  .strict();

export const workoutSessionQuerySchema = z
  .object({
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    status: z.enum(["in_progress", "completed", "abandoned"]).optional(),
  })
  .strict();
