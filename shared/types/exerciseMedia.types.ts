export type ExerciseMediaProvider = "ymove";

export type ExerciseMedia = {
  provider: ExerciseMediaProvider;
  providerExerciseId: string;
  attribution?: string;
  instructions?: string[];
};

export type ExerciseMediaAvailableResponse = {
  status: "available";
  exerciseId: string;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  instructions: string[];
  attribution?: string;
};

export type ExerciseMediaUnavailableReason =
  | "not_mapped"
  | "not_configured"
  | "provider_error"
  | "video_unavailable";

export type ExerciseMediaUnavailableResponse = {
  status: "unavailable";
  exerciseId: string;
  reason: ExerciseMediaUnavailableReason;
  instructions?: string[];
};

export type ExerciseMediaResponse =
  | ExerciseMediaAvailableResponse
  | ExerciseMediaUnavailableResponse;
