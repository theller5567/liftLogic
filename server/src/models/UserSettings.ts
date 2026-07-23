import { Schema, model } from "mongoose";

import type { UserSettings } from "../../../shared/types/userSettings.types";

export type UserSettingsDocument = UserSettings & {
  clientId: string;
  createdAt: Date;
  updatedAt: Date;
};

const userSettingsSchema = new Schema<UserSettingsDocument>(
  {
    clientId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    weightUnit: {
      type: String,
      enum: ["lb", "kg"],
      required: true,
    },
    weightSteps: {
      default: { type: Number, required: true },
      barbell: { type: Number, required: true },
      dumbbell: { type: Number, required: true },
      machine: { type: Number, required: true },
      cable: { type: Number, required: true },
    },
    restTimer: {
      autoStartAfterSet: { type: Boolean, required: true },
      defaultSeconds: { type: Number },
    },
    equipmentInventory: [{ type: String }],
    plateLoading: {
      barbellPreset: {
        type: String,
        enum: ["olympic_mens", "olympic_womens", "custom"],
        required: true,
      },
      customBarbellWeight: { type: Number },
      plates: {
        kg: [
          {
            count: { type: Number, required: true },
            size: { type: Number, required: true },
          },
        ],
        lb: [
          {
            count: { type: Number, required: true },
            size: { type: Number, required: true },
          },
        ],
      },
      unit: {
        type: String,
        enum: ["lb", "kg"],
        required: true,
      },
    },
    theme: {
      primaryColor: { type: String, required: true },
      secondaryColor: { type: String, required: true },
    },
    messages: {
      categories: {
        completion: { type: Boolean, required: true },
        progressive_overload: { type: Boolean, required: true },
        personal_record: { type: Boolean, required: true },
        consistency: { type: Boolean, required: true },
        recovery: { type: Boolean, required: true },
        education: { type: Boolean, required: true },
      },
      frequency: {
        type: String,
        enum: ["standard", "fewer", "important_only"],
        required: true,
      },
      surfaces: {
        dashboard: { type: Boolean, required: true },
        workout_summary: { type: Boolean, required: true },
        workout_exercise: { type: Boolean, required: true },
        trends: { type: Boolean, required: true },
      },
      futureReminders: { type: Boolean, required: true },
      nonCriticalSnoozedUntil: { type: String },
    },
    exerciseHistory: {
      includePreviousPrograms: { type: Boolean, required: true },
      resetCutoffs: {
        type: Map,
        of: String,
        default: {},
      },
    },
  },
  { timestamps: true }
);

export const UserSettingsModel = model<UserSettingsDocument>(
  "UserSettings",
  userSettingsSchema,
  "userSettings"
);
