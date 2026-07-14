import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch, type Path, type SubmitHandler } from "react-hook-form";

import { onboardingConfig } from "../utils/onboardingConfig";
import { getPresetEquipmentItems } from "../../../shared/constants/equipmentCatalog";
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
  onboardingMode: undefined,
  selectedWorkoutTemplateId: undefined,
  goal: undefined,
  goalPriority: undefined,
  experienceLevel: undefined,
  equipmentAccess: undefined,
  availableEquipment: undefined,
  availableTrainingDays: undefined,
  gender: undefined,
  ageRange: undefined,
  focusArea: undefined,
  focusDurationWeeks: undefined,
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
  const previousEquipmentAccessRef = useRef(defaultAnswers.equipmentAccess);
  const watchedValues = useWatch({
    control,
    defaultValue: defaultAnswers,
  }) as OnboardingAnswers;

  const answers = useMemo(
    () => ({
      ...defaultAnswers,
      ...watchedValues,
      benchPress: {
        ...defaultAnswers.benchPress,
        ...watchedValues.benchPress,
      },
      dumbbellRow: {
        ...defaultAnswers.dumbbellRow,
        ...watchedValues.dumbbellRow,
      },
      squat: {
        ...defaultAnswers.squat,
        ...watchedValues.squat,
      },
      barbellDeadlift: {
        ...defaultAnswers.barbellDeadlift,
        ...watchedValues.barbellDeadlift,
      },
    }),
    [defaultAnswers, watchedValues]
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
    if (!answers.equipmentAccess) {
      return;
    }

    const equipmentAccessChanged =
      previousEquipmentAccessRef.current !== answers.equipmentAccess;

    if (equipmentAccessChanged || !answers.availableEquipment?.length) {
      setValue("availableEquipment", getPresetEquipmentItems(answers.equipmentAccess), {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    previousEquipmentAccessRef.current = answers.equipmentAccess;
  }, [answers.availableEquipment?.length, answers.equipmentAccess, setValue]);

  useEffect(() => {
    if (answers.onboardingMode === "guided" && answers.selectedWorkoutTemplateId) {
      setValue("selectedWorkoutTemplateId", undefined, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    if (answers.onboardingMode === "browse" && answers.goal) {
      setValue("goal", undefined, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("goalPriority", undefined, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [
    answers.goal,
    answers.onboardingMode,
    answers.selectedWorkoutTemplateId,
    setValue,
  ]);

  const lastStepIndex = Math.max(visibleSteps.length - 1, 0);
  const activeStepIndex = Math.min(currentStepIndex, lastStepIndex);

  useEffect(() => {
    onAnswersChange?.(answers);
  }, [answers, onAnswersChange]);

  useEffect(() => {
    onStepIndexChange?.(activeStepIndex);
  }, [activeStepIndex, onStepIndexChange]);

  const currentStep = visibleSteps[activeStepIndex];
  const isLastStep = activeStepIndex === lastStepIndex;

  const onSubmit: SubmitHandler<OnboardingAnswers> = (data) => {
    onComplete?.(data);
  };

  const goNext = async () => {
    if (!currentStep) {
      return;
    }

    if ("field" in currentStep && currentStep.field && currentStep.required) {
      const isValid = await trigger(currentStep.field as Path<OnboardingAnswers>);

      if (!isValid) {
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

    if (nextStepIndex >= latestVisibleSteps.length) {
      void handleSubmit(onSubmit)();
      return;
    }

    setCurrentStepIndex(nextStepIndex);
  };

  const goBack = () => {
    setCurrentStepIndex(Math.max(activeStepIndex - 1, 0));
  };

  if (!currentStep) {
    return <div>No onboarding steps available.</div>;
  }

  return (
    <div id="onboarding-shell">
      <form
        onSubmit={handleSubmit(onSubmit)}
        id="onboarding-form"
        className="grid gap-5 border-panel"
      >
        <OnboardingStepHeader
          step={currentStep}
          visibleSteps={visibleSteps}
        />

        <OnboardingStepContent
          answers={answers}
          control={control}
          errors={errors}
          step={currentStep}
        />

        <OnboardingStepActions
          canGoBack={activeStepIndex > 0}
          isLastStep={isLastStep}
          onBack={goBack}
          onNext={goNext}
        />
      </form>
    </div>
  );
};

export default OnboardingFlow;
