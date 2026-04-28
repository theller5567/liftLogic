import { z } from "zod";

import type { OnboardingAnswers } from "../../../shared/types/onboarding.types";
import type { GeneratedWorkoutPreview } from "../../../shared/utils/generateWorkoutPreview";

const goalSchema = z.enum(["hypertrophy", "strength", "hybrid"]);
const goalPrioritySchema = z.enum(["hypertrophy", "strength"]);
const experienceLevelSchema = z.enum(["beginner", "intermediate", "advanced"]);
const equipmentAccessSchema = z.enum([
  "full_gym",
  "home_gym",
  "dumbbells_only",
  "basic_equipment",
]);
const weightUnitSchema = z.enum(["lb", "kg"]);
const confidenceSchema = z.enum(["high", "medium", "low"]);
const familiaritySchema = z.enum(["never", "some", "often"]);

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
    goal: goalSchema.optional(),
    goalPriority: goalPrioritySchema.optional(),
    experienceLevel: experienceLevelSchema.optional(),
    equipmentAccess: equipmentAccessSchema.optional(),
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
  })
  .strict() satisfies z.ZodType<GeneratedWorkoutPreview>;

export const onboardingSubmissionSchema = z
  .object({
    answers: onboardingAnswersSchema,
  })
  .strict();

export const editedWorkoutPreviewSubmissionSchema = z
  .object({
    editedPreview: generatedWorkoutPreviewSchema,
  })
  .strict();
