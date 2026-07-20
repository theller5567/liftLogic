import { Schema, model, Types } from "mongoose";

import type {
  WorkoutBadgeId,
  WorkoutSessionDeletionReason,
  WorkoutDaySnapshot,
  WorkoutExerciseLog,
  WorkoutSessionStatus,
} from "../../../shared/types/workoutSession.types";

export type WorkoutSessionDocument = {
  clientId: string;
  workoutPlanId: Types.ObjectId;
  programId: string;
  programHistoryId?: string;
  programDayId: string;
  programDayLabel: string;
  programVersion?: number;
  scheduledFor: Date;
  scheduledDateKey: string;
  startedAt: Date;
  completedAt?: Date | null;
  status: WorkoutSessionStatus;
  workoutSnapshot: WorkoutDaySnapshot;
  completionPercentage: number;
  completedExerciseCount: number;
  totalExerciseCount: number;
  notes?: string;
  badgeIds: WorkoutBadgeId[];
  durationSeconds?: number;
  exerciseLogs: WorkoutExerciseLog[];
  deletedAt?: Date | null;
  deletedReason?: WorkoutSessionDeletionReason;
  createdAt: Date;
  updatedAt: Date;
};

const workoutSessionSchema = new Schema<WorkoutSessionDocument>(
  {
    clientId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    workoutPlanId: {
      type: Schema.Types.ObjectId,
      ref: "WorkoutPlan",
      required: true,
      index: true,
    },
    programId: {
      type: String,
      required: true,
      trim: true,
    },
    programHistoryId: {
      type: String,
      index: true,
      trim: true,
    },
    programVersion: {
      type: Number,
      min: 1,
      index: true,
    },
    programDayId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    programDayLabel: {
      type: String,
      required: true,
      trim: true,
    },
    scheduledFor: {
      type: Date,
      required: true,
      index: true,
    },
    scheduledDateKey: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    startedAt: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    completedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["in_progress", "completed", "abandoned"],
      default: "in_progress",
      required: true,
      index: true,
    },
    workoutSnapshot: {
      type: Schema.Types.Mixed,
      required: true,
    },
    completionPercentage: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },
    completedExerciseCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalExerciseCount: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    badgeIds: {
      type: [String],
      default: [],
    },
    durationSeconds: {
      type: Number,
      min: 0,
    },
    exerciseLogs: {
      type: [Schema.Types.Mixed] as unknown as typeof Schema.Types.Mixed,
      required: true,
      default: [],
    },
    deletedAt: {
      type: Date,
      index: true,
    },
    deletedReason: {
      type: String,
      enum: ["user_deleted", "account_deleted", "program_reset"],
    },
  },
  { timestamps: true }
);

workoutSessionSchema.index({ clientId: 1, scheduledFor: 1 });
workoutSessionSchema.index({ clientId: 1, status: 1 });
workoutSessionSchema.index({ clientId: 1, deletedAt: 1 });
workoutSessionSchema.index({ clientId: 1, programHistoryId: 1 });
workoutSessionSchema.index(
  {
    clientId: 1,
    workoutPlanId: 1,
    programHistoryId: 1,
    programDayId: 1,
    scheduledDateKey: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      deletedAt: { $exists: false },
      scheduledDateKey: { $type: "string" },
      status: { $in: ["in_progress", "completed"] },
    },
  }
);

export const WorkoutSession = model<WorkoutSessionDocument>(
  "WorkoutSession",
  workoutSessionSchema,
  "workoutSessions"
);
