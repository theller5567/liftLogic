import type {
  ExerciseMedia,
  ExerciseMediaAvailableResponse,
} from "../../../shared/types/exerciseMedia.types";
import { env } from "../config/env";

type YMoveMediaResult =
  | { ok: true; media: ExerciseMediaAvailableResponse }
  | { ok: false };

const getString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

const getStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  return [];
};

const getNestedObject = (value: unknown, key: string): Record<string, unknown> | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const nested = (value as Record<string, unknown>)[key];
  return nested && typeof nested === "object"
    ? (nested as Record<string, unknown>)
    : null;
};

function normalizeYMoveResponse({
  exerciseId,
  fallbackInstructions,
  fallbackTitle,
  media,
  payload,
}: {
  exerciseId: string;
  fallbackInstructions: string[];
  fallbackTitle: string;
  media: ExerciseMedia;
  payload: unknown;
}): YMoveMediaResult {
  const data =
    getNestedObject(payload, "data") ??
    getNestedObject(payload, "exercise") ??
    (payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : null);

  if (!data) {
    return { ok: false };
  }

  const video =
    getNestedObject(data, "video") ??
    getNestedObject(data, "videos") ??
    getNestedObject(data, "media");
  const videoUrl =
    getString(data.videoUrl) ??
    getString(data.video_url) ??
    getString(data.hlsUrl) ??
    getString(data.hls_url) ??
    getString(data.streamUrl) ??
    getString(data.stream_url) ??
    getString(video?.url) ??
    getString(video?.videoUrl) ??
    getString(video?.video_url) ??
    getString(video?.hlsUrl) ??
    getString(video?.hls_url);

  if (!videoUrl) {
    return { ok: false };
  }

  const instructions =
    getStringArray(data.instructions).length > 0
      ? getStringArray(data.instructions)
      : getStringArray(data.steps).length > 0
        ? getStringArray(data.steps)
        : fallbackInstructions;

  return {
    ok: true,
    media: {
      status: "available",
      exerciseId,
      title: getString(data.name) ?? getString(data.title) ?? fallbackTitle,
      videoUrl,
      thumbnailUrl:
        getString(data.thumbnailUrl) ??
        getString(data.thumbnail_url) ??
        getString(video?.thumbnailUrl) ??
        getString(video?.thumbnail_url),
      instructions,
      attribution: media.attribution ?? "YMove",
    },
  };
}

export async function fetchYMoveExerciseMedia({
  exerciseId,
  fallbackInstructions,
  fallbackTitle,
  media,
}: {
  exerciseId: string;
  fallbackInstructions: string[];
  fallbackTitle: string;
  media: ExerciseMedia;
}): Promise<YMoveMediaResult> {
  if (!env.ymoveApiKey) {
    return { ok: false };
  }

  const baseUrl = env.ymoveApiBaseUrl.replace(/\/$/, "");
  const providerExerciseId = encodeURIComponent(media.providerExerciseId);
  const response = await fetch(`${baseUrl}/exercises/${providerExerciseId}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${env.ymoveApiKey}`,
      "x-api-key": env.ymoveApiKey,
    },
  });

  if (!response.ok) {
    return { ok: false };
  }

  return normalizeYMoveResponse({
    exerciseId,
    fallbackInstructions,
    fallbackTitle,
    media,
    payload: await response.json().catch(() => null),
  });
}
