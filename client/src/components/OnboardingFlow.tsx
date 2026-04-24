import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch, type Path, type SubmitHandler } from "react-hook-form";

import { onboardingConfig } from "../utils/onboardingConfig";
import type { OnboardingAnswers } from "../../../shared/types/onboarding.types";
import OnboardingStepActions from "./onboarding/OnboardingStepActions";
import OnboardingStepContent from "./onboarding/OnboardingStepContent";
import OnboardingStepHeader from "./onboarding/OnboardingStepHeader";
import type { OnboardingStep, ShowIfCondition } from "./onboarding/types";
import { matchesCondition } from "./onboarding/utils";
import '../styles/components/onboarding.scss';

type OnboardingFlowProps = {
  initialAnswers?: Partial<OnboardingAnswers>;
  initialStepIndex?: number;
  onComplete?: (answers: OnboardingAnswers) => void;
  onAnswersChange?: (answers: OnboardingAnswers) => void;
  onStepIndexChange?: (stepIndex: number) => void;
};

const emptyAnswers: OnboardingAnswers = {
  goal: undefined,
  goalPriority: undefined,
  experienceLevel: undefined,
  equipmentAccess: undefined,
  weightUnit: undefined,
  bodyWeight: undefined,
  benchPress: {
    familiarity: undefined,
    knowsWorkingWeight: undefined,
    estimatedWeight: undefined,
    estimatedReps: undefined,
    confidence: undefined,
  },
  dumbbellRow: {
    familiarity: undefined,
    knowsWorkingWeight: undefined,
    estimatedWeight: undefined,
    estimatedReps: undefined,
    confidence: undefined,
  },
  squat: {
    familiarity: undefined,
    knowsWorkingWeight: undefined,
    estimatedWeight: undefined,
    estimatedReps: undefined,
    confidence: undefined,
  },
  barbellDeadlift: {
    familiarity: undefined,
    knowsWorkingWeight: undefined,
    estimatedWeight: undefined,
    estimatedReps: undefined,
    confidence: undefined,
  },
};

const buildDefaultAnswers = (
  initialAnswers: Partial<OnboardingAnswers> | undefined
): OnboardingAnswers => ({
  ...emptyAnswers,
  ...initialAnswers,
  benchPress: {
    ...emptyAnswers.benchPress,
    ...initialAnswers?.benchPress,
  },
  dumbbellRow: {
    ...emptyAnswers.dumbbellRow,
    ...initialAnswers?.dumbbellRow,
  },
  squat: {
    ...emptyAnswers.squat,
    ...initialAnswers?.squat,
  },
  barbellDeadlift: {
    ...emptyAnswers.barbellDeadlift,
    ...initialAnswers?.barbellDeadlift,
  },
});

const isStepVisible = (values: OnboardingAnswers, step: OnboardingStep) => {
  return matchesCondition(values, step.showIf as ShowIfCondition | undefined);
};

const DEBUG_ONBOARDING = true;

const OnboardingFlow = ({
  initialAnswers,
  initialStepIndex = 0,
  onComplete,
  onAnswersChange,
  onStepIndexChange,
}: OnboardingFlowProps) => {
  const defaultAnswers = useMemo(
    () => buildDefaultAnswers(initialAnswers),
    [initialAnswers]
  );

  const {
    control,
    getValues,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<OnboardingAnswers>({
    defaultValues: defaultAnswers,
    mode: "onTouched",
    shouldUnregister: false,
  });

  const [currentStepIndex, setCurrentStepIndex] = useState(initialStepIndex);
  const watchedValues = useWatch({
    control,
    defaultValue: defaultAnswers,
  });

  const answers = useMemo(
    () => ({
      ...defaultAnswers,
      ...getValues(),
      benchPress: {
        ...defaultAnswers.benchPress,
        ...getValues().benchPress,
      },
      dumbbellRow: {
        ...defaultAnswers.dumbbellRow,
        ...getValues().dumbbellRow,
      },
      squat: {
        ...defaultAnswers.squat,
        ...getValues().squat,
      },
      barbellDeadlift: {
        ...defaultAnswers.barbellDeadlift,
        ...getValues().barbellDeadlift,
      },
    }),
    [defaultAnswers, getValues, watchedValues]
  );

  const visibleSteps = useMemo(
    () => onboardingConfig.steps.filter((step) => isStepVisible(answers, step)),
    [answers]
  );

  useEffect(() => {
    if (answers.goal === "hypertrophy" || answers.goal === "strength") {
      setValue("goalPriority", answers.goal, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [answers.goal, setValue]);

  useEffect(() => {
    if (currentStepIndex > visibleSteps.length - 1) {
      setCurrentStepIndex(Math.max(visibleSteps.length - 1, 0));
    }
  }, [currentStepIndex, visibleSteps.length]);

  useEffect(() => {
    onAnswersChange?.(answers);
  }, [answers, onAnswersChange]);

  useEffect(() => {
    onStepIndexChange?.(currentStepIndex);
  }, [currentStepIndex, onStepIndexChange]);

  useEffect(() => {
    if (!DEBUG_ONBOARDING) {
      return;
    }

    console.groupCollapsed("[OnboardingFlow] Visible steps");
    console.log("currentStepIndex:", currentStepIndex);
    console.log("currentStepId:", visibleSteps[currentStepIndex]?.id ?? null);
    console.log("equipmentAccess:", answers.equipmentAccess);
    console.log("goal:", answers.goal);
    console.log("experienceLevel:", answers.experienceLevel);
    console.log("benchPress:", answers.benchPress);
    console.log("dumbbellRow:", answers.dumbbellRow);
    console.log("squat:", answers.squat);
    console.log("barbellDeadlift:", answers.barbellDeadlift);
    console.log(
      "visibleStepIds:",
      visibleSteps.map((step) => step.id)
    );
    console.groupEnd();
  }, [answers, currentStepIndex, visibleSteps]);

  const currentStep = visibleSteps[currentStepIndex];
  const isLastStep = currentStepIndex === visibleSteps.length - 1;

  const onSubmit: SubmitHandler<OnboardingAnswers> = (data) => {
    onComplete?.(data);
    console.log("Onboarding complete:", data);
  };

  const goNext = async () => {
    if (!currentStep) {
      return;
    }

    if (DEBUG_ONBOARDING) {
      console.groupCollapsed("[OnboardingFlow] Next clicked");
      console.log("currentStepId:", currentStep.id);
      console.log("currentStepIndex:", currentStepIndex);
    }

    if ("field" in currentStep && currentStep.field && currentStep.required) {
      const isValid = await trigger(currentStep.field as Path<OnboardingAnswers>);

      if (DEBUG_ONBOARDING) {
        console.log("validatedField:", currentStep.field);
        console.log("isValid:", isValid);
      }

      if (!isValid) {
        if (DEBUG_ONBOARDING) {
          console.groupEnd();
        }
        return;
      }
    }

    const latestAnswers = getValues();
    const latestVisibleSteps = onboardingConfig.steps.filter((step) =>
      isStepVisible(latestAnswers, step)
    );
    const latestStepIndex = latestVisibleSteps.findIndex(
      (step) => step.id === currentStep.id
    );
    const nextStepIndex = latestStepIndex + 1;

    if (DEBUG_ONBOARDING) {
      console.log("latestAnswers:", latestAnswers);
      console.log(
        "latestVisibleStepIds:",
        latestVisibleSteps.map((step) => step.id)
      );
      console.log("latestStepIndex:", latestStepIndex);
      console.log("nextStepIndex:", nextStepIndex);
      console.log("nextStepId:", latestVisibleSteps[nextStepIndex]?.id ?? null);
    }

    if (nextStepIndex >= latestVisibleSteps.length) {
      if (DEBUG_ONBOARDING) {
        console.log("submittingAnswers:", latestAnswers);
        console.groupEnd();
      }
      void handleSubmit(onSubmit)();
      return;
    }

    setCurrentStepIndex(nextStepIndex);

    if (DEBUG_ONBOARDING) {
      console.groupEnd();
    }
  };

  const goBack = () => {
    setCurrentStepIndex((index) => Math.max(index - 1, 0));
  };

  if (!currentStep) {
    return <div>No onboarding steps available.</div>;
  }

  return (
    <div style={{ width: "min(100%, 42rem)" }}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        id="onboarding-form"
        style={{
          display: "grid",
          gap: "1.5rem",
          padding: "1.5rem",
          borderRadius: "1rem",
          background: "hsl(var(--clr-neutral-800-b))",
          border: "1px solid hsl(var(--clr-neutral-600-b) / 0.35)",
        }}
      >
        <OnboardingStepHeader
          step={currentStep}
          visibleSteps={visibleSteps}
        />

        <OnboardingStepContent
          control={control}
          errors={errors}
          step={currentStep}
          answers={answers}
        />

        <OnboardingStepActions
          canGoBack={currentStepIndex > 0}
          isLastStep={isLastStep}
          onBack={goBack}
          onNext={goNext}
        />
      </form>
    </div>
  );
};

export default OnboardingFlow;
