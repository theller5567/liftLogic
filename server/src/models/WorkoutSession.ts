import { Schema, model, Types } from "mongoose";

import type {
  WorkoutBadgeId,
  WorkoutDaySnapshot,
  WorkoutExerciseLog,
  WorkoutSessionStatus,
} from "../../../shared/types/workoutSession.types";

export type WorkoutSessionDocument = {
  clientId: string;
  workoutPlanId: Types.ObjectId;
  programId: string;
  programDayId: string;
  programDayLabel: string;
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
  },
  { timestamps: true }
);

workoutSessionSchema.index({ clientId: 1, scheduledFor: 1 });
workoutSessionSchema.index({ clientId: 1, status: 1 });
workoutSessionSchema.index(
  {
    clientId: 1,
    workoutPlanId: 1,
    programDayId: 1,
    scheduledDateKey: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
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
