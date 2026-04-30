import { Schema, model } from "mongoose";

export type UserProfileDocument = {
  clientId: string;
  displayName?: string;
  authProvider?: "anonymous" | "firebase";
  authUserId?: string;
  email?: string;
  emailVerified?: boolean;
  photoUrl?: string;
  lastLoginAt?: Date;
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
      index: {
        unique: true,
        sparse: true,
      },
      sparse: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    emailVerified: {
      type: Boolean,
    },
    photoUrl: {
      type: String,
      trim: true,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const UserProfile = model<UserProfileDocument>(
  "UserProfile",
  userProfileSchema,
  "userProfiles"
);
