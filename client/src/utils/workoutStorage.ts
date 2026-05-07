import type { OnboardingAnswers } from "../../../shared/types/onboarding.types";
import type { UserSettings } from "../../../shared/types/userSettings.types";
import type { GeneratedWorkoutPreview } from "./generateWorkoutPreview";

const STORAGE_KEYS = {
  submittedAnswers: "liftlogic:onboarding:submitted",
  draftAnswers: "liftlogic:onboarding:draft",
  draftStepIndex: "liftlogic:onboarding:step",
  editedWorkoutPreview: "liftlogic:workout-preview:edited",
  workoutReviewed: "liftlogic:workout-review:reviewed",
  userSettings: "liftlogic:user-settings",
} as const;

const canUseStorage = () => typeof window !== "undefined";

function readStoredJson<T>(storageKey: string): T | null {
  if (!canUseStorage()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(storageKey);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
}

function writeStoredJson<T>(storageKey: string, value: T | null) {
  if (!canUseStorage()) {
    return;
  }

  if (value === null) {
    window.localStorage.removeItem(storageKey);
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(value));
}

export const readSubmittedAnswers = () =>
  readStoredJson<OnboardingAnswers>(STORAGE_KEYS.submittedAnswers);

export const writeSubmittedAnswers = (answers: OnboardingAnswers | null) => {
  writeStoredJson(STORAGE_KEYS.submittedAnswers, answers);
};

export const readDraftAnswers = () =>
  readStoredJson<OnboardingAnswers>(STORAGE_KEYS.draftAnswers);

export const writeDraftAnswers = (answers: OnboardingAnswers | null) => {
  writeStoredJson(STORAGE_KEYS.draftAnswers, answers);
};

export const readDraftStepIndex = () => {
  if (!canUseStorage()) {
    return 0;
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEYS.draftStepIndex);
  if (!rawValue) {
    return 0;
  }

  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

export const writeDraftStepIndex = (stepIndex: number) => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEYS.draftStepIndex, String(stepIndex));
};

export const clearDraftStepIndex = () => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEYS.draftStepIndex);
};

export const readEditedWorkoutPreview = () =>
  readStoredJson<GeneratedWorkoutPreview>(STORAGE_KEYS.editedWorkoutPreview);

export const writeEditedWorkoutPreview = (
  preview: GeneratedWorkoutPreview | null
) => {
  writeStoredJson(STORAGE_KEYS.editedWorkoutPreview, preview);
};

export const readWorkoutReviewed = () => {
  if (!canUseStorage()) {
    return false;
  }

  return window.localStorage.getItem(STORAGE_KEYS.workoutReviewed) === "true";
};

export const writeWorkoutReviewed = (reviewed: boolean) => {
  if (!canUseStorage()) {
    return;
  }

  if (!reviewed) {
    window.localStorage.removeItem(STORAGE_KEYS.workoutReviewed);
    return;
  }

  window.localStorage.setItem(STORAGE_KEYS.workoutReviewed, "true");
};

export const readUserSettings = () =>
  readStoredJson<UserSettings>(STORAGE_KEYS.userSettings);

export const writeUserSettings = (settings: UserSettings | null) => {
  writeStoredJson(STORAGE_KEYS.userSettings, settings);
};
