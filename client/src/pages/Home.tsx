import { useEffect, useMemo, useState } from "react";

import OnboardingFlow from "../components/OnboardingFlow";
import WorkoutPreview from "../components/WorkoutPreview";
import type { OnboardingAnswers } from "../../../shared/types/onboarding.types";
import { generateWorkoutPreview } from "../utils/generateWorkoutPreview";

const SUBMITTED_ANSWERS_STORAGE_KEY = "liftlogic:onboarding:submitted";
const DRAFT_ANSWERS_STORAGE_KEY = "liftlogic:onboarding:draft";
const DRAFT_STEP_STORAGE_KEY = "liftlogic:onboarding:step";

const readStoredAnswers = (storageKey: string): OnboardingAnswers | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(storageKey);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as OnboardingAnswers;
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
};

const readStoredStepIndex = (): number => {
  if (typeof window === "undefined") {
    return 0;
  }

  const rawValue = window.localStorage.getItem(DRAFT_STEP_STORAGE_KEY);
  if (!rawValue) {
    return 0;
  }

  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const Home = () => {
  const [submittedAnswers, setSubmittedAnswers] = useState<OnboardingAnswers | null>(() =>
    readStoredAnswers(SUBMITTED_ANSWERS_STORAGE_KEY)
  );
  const [draftAnswers, setDraftAnswers] = useState<OnboardingAnswers | null>(() =>
    readStoredAnswers(DRAFT_ANSWERS_STORAGE_KEY)
  );
  const [draftStepIndex, setDraftStepIndex] = useState<number>(() => readStoredStepIndex());

  const preview = useMemo(
    () => (submittedAnswers ? generateWorkoutPreview(submittedAnswers) : null),
    [submittedAnswers]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (submittedAnswers) {
      window.localStorage.setItem(
        SUBMITTED_ANSWERS_STORAGE_KEY,
        JSON.stringify(submittedAnswers)
      );
      return;
    }

    window.localStorage.removeItem(SUBMITTED_ANSWERS_STORAGE_KEY);
  }, [submittedAnswers]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (draftAnswers) {
      window.localStorage.setItem(DRAFT_ANSWERS_STORAGE_KEY, JSON.stringify(draftAnswers));
      return;
    }

    window.localStorage.removeItem(DRAFT_ANSWERS_STORAGE_KEY);
  }, [draftAnswers]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(DRAFT_STEP_STORAGE_KEY, String(draftStepIndex));
  }, [draftStepIndex]);

  const handleComplete = (answers: OnboardingAnswers) => {
    setSubmittedAnswers(answers);
    setDraftAnswers(null);
    setDraftStepIndex(0);
  };

  const handleStartOver = () => {
    setSubmittedAnswers(null);
    setDraftAnswers(null);
    setDraftStepIndex(0);
  };

  return (
    <>
      {preview ? (
        <WorkoutPreview
          preview={preview}
          onStartOver={handleStartOver}
        />
      ) : (
        <OnboardingFlow
          initialAnswers={draftAnswers ?? undefined}
          initialStepIndex={draftStepIndex}
          onAnswersChange={setDraftAnswers}
          onStepIndexChange={setDraftStepIndex}
          onComplete={handleComplete}
        />
      )}
    </>
  );
};

export default Home;
