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
    theme: {
      primaryColor: { type: String, required: true },
      secondaryColor: { type: String, required: true },
    },
  },
  { timestamps: true }
);

export const UserSettingsModel = model<UserSettingsDocument>(
  "UserSettings",
  userSettingsSchema,
  "userSettings"
);
