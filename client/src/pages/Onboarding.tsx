import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import OnboardingFlow from "../components/OnboardingFlow";
import type { OnboardingAnswers } from "../../../shared/types/onboarding.types";
import {
  clearDraftStepIndex,
  readDraftAnswers,
  readDraftStepIndex,
  readSubmittedAnswers,
  writeDraftAnswers,
  writeDraftStepIndex,
  writeEditedWorkoutPreview,
  writeSubmittedAnswers,
  writeWorkoutReviewed,
} from "../utils/workoutStorage";

const Onboarding = () => {
  const navigate = useNavigate();
  const [draftAnswers, setDraftAnswers] = useState<OnboardingAnswers | null>(() =>
    readDraftAnswers() ?? readSubmittedAnswers()
  );
  const [draftStepIndex, setDraftStepIndex] = useState<number>(() =>
    readDraftStepIndex()
  );

  useEffect(() => {
    writeDraftAnswers(draftAnswers);
  }, [draftAnswers]);

  useEffect(() => {
    writeDraftStepIndex(draftStepIndex);
  }, [draftStepIndex]);

  const handleComplete = (answers: OnboardingAnswers) => {
    writeSubmittedAnswers(answers);
    writeEditedWorkoutPreview(null);
    writeWorkoutReviewed(false);
    writeDraftAnswers(null);
    clearDraftStepIndex();
    setDraftAnswers(null);
    setDraftStepIndex(0);
    navigate("/workout-review");
  };

  return (
    <OnboardingFlow
      initialAnswers={draftAnswers ?? undefined}
      initialStepIndex={draftStepIndex}
      onAnswersChange={setDraftAnswers}
      onStepIndexChange={setDraftStepIndex}
      onComplete={handleComplete}
    />
  );
};

export default Onboarding;
