import type { OnboardingAnswers } from "../../../../shared/types/onboarding.types";
import type {
  BarbellPreset,
  PlateInventoryItem,
  PlateLoadingUnit,
  UserMessageCategory,
  UserMessageFrequency,
  UserMessageSurface,
  WeightStepKey,
} from "../../../../shared/types/userSettings.types";

export const weightStepFields: Array<{
  key: WeightStepKey;
  label: string;
}> = [
  { key: "default", label: "Default" },
  { key: "barbell", label: "Barbell" },
  { key: "dumbbell", label: "Dumbbell" },
  { key: "machine", label: "Machine" },
  { key: "cable", label: "Cable" },
];

export const plateLoadingUnitOptions: Array<{
  label: string;
  value: PlateLoadingUnit;
}> = [
  { label: "lb", value: "lb" },
  { label: "kg", value: "kg" },
];

export const barbellPresetOptions: Array<{
  description: string;
  label: string;
  value: BarbellPreset;
}> = [
  {
    description: "45 lb / 20 kg",
    label: "Olympic",
    value: "olympic_mens",
  },
  {
    description: "33 lb / 15 kg",
    label: "Women's Olympic",
    value: "olympic_womens",
  },
  {
    description: "Enter your own",
    label: "Custom",
    value: "custom",
  },
];

export const messageCategoryOptions: Array<{
  description: string;
  key: UserMessageCategory;
  label: string;
}> = [
  {
    description: "Weekly targets, finished sessions, and completed plans.",
    key: "completion",
    label: "Completion",
  },
  {
    description: "Increase, repeat, hold, and drop-weight coaching.",
    key: "progressive_overload",
    label: "Progressive overload",
  },
  {
    description: "Compound lift records and strength milestones.",
    key: "personal_record",
    label: "Personal records",
  },
  {
    description: "Streaks and long-term training rhythm.",
    key: "consistency",
    label: "Consistency",
  },
  {
    description: "Pain, form, missed-target, and recovery cautions.",
    key: "recovery",
    label: "Recovery and caution",
  },
  {
    description: "Short coaching tips and app guidance.",
    key: "education",
    label: "Education tips",
  },
];

export const messageSurfaceOptions: Array<{
  key: UserMessageSurface;
  label: string;
}> = [
  { key: "dashboard", label: "Dashboard messages" },
  { key: "workout_summary", label: "Workout summary insights" },
  { key: "workout_exercise", label: "Exercise-page guidance" },
  { key: "trends", label: "Trends insights" },
];

export const messageFrequencyOptions: Array<{
  description: string;
  label: string;
  value: UserMessageFrequency;
}> = [
  {
    description: "Show the normal mix of useful coaching messages.",
    label: "Standard",
    value: "standard",
  },
  {
    description: "Hide lower-priority completion and info messages.",
    label: "Fewer messages",
    value: "fewer",
  },
  {
    description: "Only show warning-level messages and protected cautions.",
    label: "Important only",
    value: "important_only",
  },
];

export const toNumberInputValue = (value: number | undefined) =>
  value === undefined ? "" : String(value);

export const parsePositiveNumber = (value: string) => {
  const nextValue = Number(value);

  return Number.isFinite(nextValue) && nextValue > 0 ? nextValue : undefined;
};

export const sortPlateInventory = (plates: PlateInventoryItem[]) =>
  [...plates].sort((left, right) => right.size - left.size);

export const formatFocusDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(value));

export const addDaysIso = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate.toISOString();
};

export const formatSettingLabel = (
  value: string | number | undefined | null
) => {
  if (value === undefined || value === null || value === "") {
    return "Not answered";
  }

  return String(value)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export const formatAnswerList = (values: string[] | undefined) =>
  values?.length ? values.map(formatSettingLabel).join(", ") : "Not answered";

export const formatBodyStats = (answers: OnboardingAnswers) => {
  const stats = [
    answers.heightInches ? `${answers.heightInches} in` : null,
    answers.bodyWeight
      ? `${answers.bodyWeight} ${answers.weightUnit ?? "lb"}`
      : null,
  ].filter(Boolean);

  return stats.length ? stats.join(" / ") : "Not answered";
};

export const formatAnchorAnswer = (
  label: string,
  answer: OnboardingAnswers["benchPress"],
  unit: OnboardingAnswers["weightUnit"]
) => {
  if (!answer?.estimatedWeight || !answer.estimatedReps) {
    return `${label}: Not answered`;
  }

  const confidence = answer.confidence
    ? `, ${formatSettingLabel(answer.confidence)} confidence`
    : "";

  return `${label}: ${answer.estimatedWeight} ${unit ?? "lb"} x ${answer.estimatedReps}${confidence}`;
};

export const buildOnboardingSnapshotRows = (answers: OnboardingAnswers) => [
  { label: "Goal", value: formatSettingLabel(answers.goalPriority ?? answers.goal) },
  { label: "Experience", value: formatSettingLabel(answers.experienceLevel) },
  {
    label: "Schedule",
    value: answers.availableTrainingDays
      ? `${answers.availableTrainingDays} days / ${formatSettingLabel(answers.sessionLength)}`
      : "Not answered",
  },
  {
    label: "Equipment",
    value: answers.availableEquipment?.length
      ? formatAnswerList(answers.availableEquipment)
      : formatSettingLabel(answers.equipmentAccess),
  },
  { label: "Body stats", value: formatBodyStats(answers) },
  {
    label: "Starting lifts",
    value: [
      formatAnchorAnswer("Bench", answers.benchPress, answers.weightUnit),
      formatAnchorAnswer("Squat", answers.squat, answers.weightUnit),
      formatAnchorAnswer("Deadlift", answers.barbellDeadlift, answers.weightUnit),
      formatAnchorAnswer("Row", answers.dumbbellRow, answers.weightUnit),
    ].join(" • "),
  },
];
