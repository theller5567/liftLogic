import { Schema, model } from "mongoose";

export type UserProfileDocument = {
  clientId: string;
  displayName?: string;
  authProvider?: "anonymous" | "firebase";
  authUserId?: string;
  createdAt: Date;
  updatedAt: Date;
};

const userProfileSchema = new Schema<UserProfileDocument>(
  {
    clientId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    displayName: {
      type: String,
      trim: true,
    },
    authProvider: {
      type: String,
      enum: ["anonymous", "firebase"],
      default: "anonymous",
    },
    authUserId: {
      type: String,
      index: true,
      sparse: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export const UserProfile = model<UserProfileDocument>(
  "UserProfile",
  userProfileSchema
);
