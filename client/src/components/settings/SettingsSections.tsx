import { useState } from "react";
import { Bell, CircleDot, Dumbbell, Minus, Plus, Target } from "lucide-react";
import ProgramIcon from "../../assets/icons/001-notes.svg?react";
import TrainingIcon from "../../assets/icons/003-weightlifting.svg?react";
import RestTimerIcon from "../../assets/icons/005-cooldown.svg?react";
import AppearanceIcon from "../../assets/icons/012-theme.svg?react";
import AccountIcon from "../../assets/icons/013-user.svg?react";
import HistoryIcon from "../../assets/icons/file.svg?react";
import DataIcon from "../../assets/icons/database.svg?react";

import type { WorkoutPlanDto } from "../../services/api";
import EquipmentInventoryPicker from "../EquipmentInventoryPicker";
import FormField, { SelectInput, TextInput } from "../ui/FormField";
import SectionAccordion from "../ui/SectionAccordion";
import type { EquipmentItemId } from "../../../../shared/constants/equipmentCatalog";
import type { OnboardingAnswers } from "../../../../shared/types/onboarding.types";
import {
  WORKOUT_FOCUS_DURATION_WEEKS,
  type WorkoutFocusArea,
  type WorkoutFocusBlock,
} from "../../../../shared/types/workoutFocus.types";
import {
  getWorkoutFocusLabel,
  isWorkoutFocusBlockActive,
} from "../../../../shared/utils/workoutFocus";
import type {
  BarbellPreset,
  PlateInventoryItem,
  PlateLoadingUnit,
  UserSettings,
  UserMessageCategory,
  UserMessageFrequency,
  UserMessageSurface,
  WeightStepKey,
} from "../../../../shared/types/userSettings.types";
import Button from "../Button";
import "../../styles/components/onboarding.scss";
import styles from "../../styles/pages/settings.module.scss";

type SettingsUpdate = (updater: (current: UserSettings) => UserSettings) => void;

type FocusAreaOption = {
  label: string;
  value: WorkoutFocusArea;
};

const weightStepFields: Array<{
  key: WeightStepKey;
  label: string;
}> = [
  { key: "default", label: "Default" },
  { key: "barbell", label: "Barbell" },
  { key: "dumbbell", label: "Dumbbell" },
  { key: "machine", label: "Machine" },
  { key: "cable", label: "Cable" },
];

const plateLoadingUnitOptions: Array<{
  label: string;
  value: PlateLoadingUnit;
}> = [
  { label: "lb", value: "lb" },
  { label: "kg", value: "kg" },
];

const barbellPresetOptions: Array<{
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

const messageCategoryOptions: Array<{
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

const messageSurfaceOptions: Array<{
  key: UserMessageSurface;
  label: string;
}> = [
  { key: "dashboard", label: "Dashboard messages" },
  { key: "workout_summary", label: "Workout summary insights" },
  { key: "workout_exercise", label: "Exercise-page guidance" },
  { key: "trends", label: "Trends insights" },
];

const messageFrequencyOptions: Array<{
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

const toNumberInputValue = (value: number | undefined) =>
  value === undefined ? "" : String(value);

const parsePositiveNumber = (value: string) => {
  const nextValue = Number(value);

  return Number.isFinite(nextValue) && nextValue > 0 ? nextValue : undefined;
};

const sortPlateInventory = (plates: PlateInventoryItem[]) =>
  [...plates].sort((left, right) => right.size - left.size);

const formatFocusDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(value));

const addDaysIso = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate.toISOString();
};

const formatSettingLabel = (value: string | number | undefined | null) => {
  if (value === undefined || value === null || value === "") {
    return "Not answered";
  }

  return String(value)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatAnswerList = (values: string[] | undefined) =>
  values?.length ? values.map(formatSettingLabel).join(", ") : "Not answered";

const formatBodyStats = (answers: OnboardingAnswers) => {
  const stats = [
    answers.heightInches ? `${answers.heightInches} in` : null,
    answers.bodyWeight
      ? `${answers.bodyWeight} ${answers.weightUnit ?? "lb"}`
      : null,
  ].filter(Boolean);

  return stats.length ? stats.join(" / ") : "Not answered";
};

const formatAnchorAnswer = (
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

const buildOnboardingSnapshotRows = (answers: OnboardingAnswers) => [
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

type ProgramSettingsSectionProps = {
  activeFocusBlock: WorkoutFocusBlock | null | undefined;
  currentWorkoutPlan: WorkoutPlanDto | null;
  focusAreaOptions: FocusAreaOption[];
  focusError: string | null;
  focusMessage: string | null;
  isSavingFocus: boolean;
  onClearFocusBlock: () => void;
  onFocusAreaChange: (focusArea: WorkoutFocusArea) => void;
  onFocusDurationChange: (durationWeeks: WorkoutFocusBlock["durationWeeks"]) => void;
  onRedoOnboarding: () => void;
  onStartFocusBlock: () => void;
  selectedFocusArea: WorkoutFocusArea;
  selectedFocusDuration: WorkoutFocusBlock["durationWeeks"];
};

export const ProgramSettingsSection = ({
  activeFocusBlock,
  currentWorkoutPlan,
  focusAreaOptions,
  focusError,
  focusMessage,
  isSavingFocus,
  onClearFocusBlock,
  onFocusAreaChange,
  onFocusDurationChange,
  onRedoOnboarding,
  onStartFocusBlock,
  selectedFocusArea,
  selectedFocusDuration,
}: ProgramSettingsSectionProps) => {
  const isFocusActive = isWorkoutFocusBlockActive(activeFocusBlock);
  const initialAnswers =
    currentWorkoutPlan?.initialOnboardingAnswers ??
    currentWorkoutPlan?.onboardingAnswers;
  const currentAnswers = currentWorkoutPlan?.onboardingAnswers;

  return (
    <SectionAccordion icon={<ProgramIcon aria-hidden="true" />} title="Program">
      <div className={styles.summaryRow}>
        <span>Workout Plan</span>
        <strong>{currentWorkoutPlan?.suggestedPreview.label ?? "Not set"}</strong>
      </div>
      <div className={styles.summaryRow}>
        <span>Current goal</span>
        <strong>
          {formatSettingLabel(currentWorkoutPlan?.onboardingAnswers.goal)}
        </strong>
      </div>
      <div className={styles.summaryRow}>
        <span>Equipment</span>
        <strong>
          {formatSettingLabel(currentWorkoutPlan?.onboardingAnswers.equipmentAccess)}
        </strong>
      </div>
      {initialAnswers ? (
        <div className={styles.onboardingSnapshotPanel}>
          <div className={styles.focusHeader}>
            <span>Starting answers</span>
            <strong>
              {currentWorkoutPlan?.createdAt
                ? formatFocusDate(currentWorkoutPlan.createdAt)
                : "Saved"}
            </strong>
          </div>
          <div className={styles.snapshotRows}>
            {buildOnboardingSnapshotRows(initialAnswers).map((row) => (
              <div key={row.label} className={styles.snapshotRow}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            ))}
          </div>
          {currentAnswers && currentAnswers !== initialAnswers ? (
            <p className={styles.messageHelper}>
              Current answers can change when you redo onboarding. This section
              keeps the original starting point for reference.
            </p>
          ) : null}
        </div>
      ) : null}
      <div className={styles.focusPanel}>
        <div className={styles.focusHeader}>
          <span>
            <Target size={16} aria-hidden="true" />
            Specialization block
          </span>
          {isFocusActive && activeFocusBlock ? (
            <strong>
              {getWorkoutFocusLabel(activeFocusBlock.focusArea)} until{" "}
              {formatFocusDate(activeFocusBlock.endsAt)}
            </strong>
          ) : (
            <strong>Off</strong>
          )}
        </div>
        <p className={styles.focusDescription}>
          Priority muscle groups are trained at least 3 times per week, or every
          workout on shorter plans.
        </p>
        <div className={styles.focusControls}>
          <FormField label="Focus area">
            <SelectInput
              value={selectedFocusArea}
              onChange={(event) =>
                onFocusAreaChange(event.target.value as WorkoutFocusArea)
              }
            >
              {focusAreaOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Duration">
            <SelectInput
              value={selectedFocusDuration}
              onChange={(event) =>
                onFocusDurationChange(
                  Number(event.target.value) as WorkoutFocusBlock["durationWeeks"]
                )
              }
            >
              {WORKOUT_FOCUS_DURATION_WEEKS.map((duration) => (
                <option key={duration} value={duration}>
                  {duration} weeks
                </option>
              ))}
            </SelectInput>
          </FormField>
        </div>
        <div className={styles.focusActions}>
          <Button
            disabled={isSavingFocus}
            label={isFocusActive ? "Replace block" : "Start block"}
            size="medium"
            tone="primary"
            onClick={onStartFocusBlock}
          />
          <Button
            disabled={isSavingFocus || !isFocusActive}
            label="Clear"
            size="medium"
            tone="gray"
            variant="outline"
            onClick={onClearFocusBlock}
          />
        </div>
        {focusError ? <p className={styles.error}>{focusError}</p> : null}
        {focusMessage ? <p className={styles.success}>{focusMessage}</p> : null}
      </div>
      <Button
        label="Redo onboarding"
        size="large"
        tone="secondary"
        onClick={onRedoOnboarding}
      />
    </SectionAccordion>
  );
};

type TrainingSettingsSectionProps = {
  draftSettings: UserSettings;
  onUpdateDraft: SettingsUpdate;
};

export const TrainingSettingsSection = ({
  draftSettings,
  onUpdateDraft,
}: TrainingSettingsSectionProps) => {
  const updateWeightStep = (key: WeightStepKey, value: string) => {
    const nextValue = Number(value);

    onUpdateDraft((current) => ({
      ...current,
      weightSteps: {
        ...current.weightSteps,
        [key]: Number.isFinite(nextValue) && nextValue > 0 ? nextValue : 0,
      },
    }));
  };

  return (
    <SectionAccordion icon={<TrainingIcon aria-hidden="true" />} title="Training">
      <FormField label="Weight unit">
        <SelectInput
          value={draftSettings.weightUnit}
          onChange={(event) =>
            onUpdateDraft((current) => ({
              ...current,
              weightUnit: event.target.value as UserSettings["weightUnit"],
            }))
          }
        >
          <option value="lb">Pounds (lb)</option>
          <option value="kg">Kilograms (kg)</option>
        </SelectInput>
      </FormField>

      <div className={styles.stepGrid}>
        {weightStepFields.map((field) => (
          <FormField key={field.key} label={`${field.label} step`}>
            <TextInput
              min="0"
              step="0.5"
              type="number"
              value={toNumberInputValue(draftSettings.weightSteps[field.key])}
              onChange={(event) => updateWeightStep(field.key, event.target.value)}
            />
          </FormField>
        ))}
      </div>
    </SectionAccordion>
  );
};

export const RestTimerSettingsSection = ({
  draftSettings,
  onUpdateDraft,
}: TrainingSettingsSectionProps) => (
  <SectionAccordion icon={<RestTimerIcon aria-hidden="true" />} title="Rest Timer">
    <label className={styles.toggleRow}>
      <span>Auto-start after set</span>
      <input
        checked={draftSettings.restTimer.autoStartAfterSet}
        type="checkbox"
        onChange={(event) =>
          onUpdateDraft((current) => ({
            ...current,
            restTimer: {
              ...current.restTimer,
              autoStartAfterSet: event.target.checked,
            },
          }))
        }
      />
    </label>

    <FormField label="Default seconds">
      <TextInput
        min="0"
        max="900"
        step="15"
        type="number"
        value={toNumberInputValue(draftSettings.restTimer.defaultSeconds)}
        onChange={(event) => {
          const nextValue = Number(event.target.value);
          onUpdateDraft((current) => ({
            ...current,
            restTimer: {
              ...current.restTimer,
              defaultSeconds:
                event.target.value === ""
                  ? undefined
                  : Number.isFinite(nextValue)
                    ? nextValue
                    : undefined,
            },
          }));
        }}
      />
    </FormField>
  </SectionAccordion>
);

export const MessageSettingsSection = ({
  draftSettings,
  onUpdateDraft,
}: TrainingSettingsSectionProps) => {
  const [renderedAt] = useState(() => Date.now());
  const snoozedUntil = draftSettings.messages.nonCriticalSnoozedUntil;
  const snoozedUntilTime = snoozedUntil
    ? new Date(snoozedUntil).getTime()
    : Number.NaN;
  const isSnoozeActive =
    Number.isFinite(snoozedUntilTime) && snoozedUntilTime > renderedAt;

  const updateMessageCategory = (
    category: UserMessageCategory,
    enabled: boolean
  ) => {
    onUpdateDraft((current) => ({
      ...current,
      messages: {
        ...current.messages,
        categories: {
          ...current.messages.categories,
          [category]: enabled,
        },
      },
    }));
  };

  const updateMessageSurface = (
    surface: UserMessageSurface,
    enabled: boolean
  ) => {
    onUpdateDraft((current) => ({
      ...current,
      messages: {
        ...current.messages,
        surfaces: {
          ...current.messages.surfaces,
          [surface]: enabled,
        },
      },
    }));
  };

  const handleSnoozeNonCritical = () => {
    onUpdateDraft((current) => ({
      ...current,
      messages: {
        ...current.messages,
        nonCriticalSnoozedUntil: addDaysIso(new Date(), 7),
      },
    }));
  };

  const handleClearMessageSnooze = () => {
    onUpdateDraft((current) => {
      const { nonCriticalSnoozedUntil, ...messages } = current.messages;
      void nonCriticalSnoozedUntil;

      return {
        ...current,
        messages,
      };
    });
  };

  return (
    <SectionAccordion icon={<Bell size={18} />} title="Messages">
      <p className={styles.focusDescription}>
        Choose which coaching messages appear and how often LiftLogic should
        surface them.
      </p>

      <FormField label="Frequency">
        <SelectInput
          value={draftSettings.messages.frequency}
          onChange={(event) =>
            onUpdateDraft((current) => ({
              ...current,
              messages: {
                ...current.messages,
                frequency: event.target.value as UserMessageFrequency,
              },
            }))
          }
        >
          {messageFrequencyOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectInput>
      </FormField>
      <p className={styles.messageHelper}>
        {
          messageFrequencyOptions.find(
            (option) => option.value === draftSettings.messages.frequency
          )?.description
        }
      </p>

      <div className={styles.messageSnoozePanel}>
        <div>
          <strong>Non-critical snooze</strong>
          <span>
            {isSnoozeActive && snoozedUntil
              ? `Snoozed until ${formatFocusDate(snoozedUntil)}`
              : "Completion, PR, progression, and education messages are active."}
          </span>
        </div>
        <div className={styles.messageSnoozeActions}>
          <Button
            label="Snooze 7 days"
            size="medium"
            tone="gray"
            variant={isSnoozeActive ? "outline" : undefined}
            onClick={handleSnoozeNonCritical}
          />
          <Button
            disabled={!isSnoozeActive}
            label="Clear snooze"
            size="medium"
            tone="secondary"
            variant="outline"
            onClick={handleClearMessageSnooze}
          />
        </div>
      </div>

      <div className={styles.messageOptionGroup}>
        <strong>Categories</strong>
        {messageCategoryOptions.map((option) => (
          <label key={option.key} className={styles.messageToggleRow}>
            <span>
              <strong>{option.label}</strong>
              <small>{option.description}</small>
            </span>
            <input
              checked={draftSettings.messages.categories[option.key]}
              type="checkbox"
              onChange={(event) =>
                updateMessageCategory(option.key, event.target.checked)
              }
            />
          </label>
        ))}
      </div>

      <p className={styles.warningMessage}>
        Recovery cautions may still appear when LiftLogic sees repeated pain,
        form, or missed-target signals.
      </p>

      <div className={styles.messageOptionGroup}>
        <strong>Surfaces</strong>
        {messageSurfaceOptions.map((option) => (
          <label key={option.key} className={styles.messageToggleRow}>
            <span>
              <strong>{option.label}</strong>
            </span>
            <input
              checked={draftSettings.messages.surfaces[option.key]}
              type="checkbox"
              onChange={(event) =>
                updateMessageSurface(option.key, event.target.checked)
              }
            />
          </label>
        ))}
        <label className={styles.messageToggleRow}>
          <span>
            <strong>Future reminders</strong>
            <small>Reserved for reminders or notifications later.</small>
          </span>
          <input
            checked={draftSettings.messages.futureReminders}
            type="checkbox"
            onChange={(event) =>
              onUpdateDraft((current) => ({
                ...current,
                messages: {
                  ...current.messages,
                  futureReminders: event.target.checked,
                },
              }))
            }
          />
        </label>
      </div>
    </SectionAccordion>
  );
};

export const ExerciseHistorySettingsSection = ({
  draftSettings,
  onUpdateDraft,
}: TrainingSettingsSectionProps) => {
  const resetCount = Object.keys(
    draftSettings.exerciseHistory.resetCutoffs
  ).length;

  return (
    <SectionAccordion icon={<HistoryIcon />} title="Exercise History">
      <p className={styles.focusDescription}>
        Control whether LiftLogic can use older program data when estimating
        starting weights, progression, and exercise-specific guidance.
      </p>

      <label className={styles.messageToggleRow}>
        <span>
          <strong>Use previous programs</strong>
          <small>
            When on, prior-program exercise logs can help guide starting
            weights and progression.
          </small>
        </span>
        <input
          checked={draftSettings.exerciseHistory.includePreviousPrograms}
          type="checkbox"
          onChange={(event) =>
            onUpdateDraft((current) => ({
              ...current,
              exerciseHistory: {
                ...current.exerciseHistory,
                includePreviousPrograms: event.target.checked,
              },
            }))
          }
        />
      </label>

      <div className={styles.historySummary}>
        <span>Exercise resets</span>
        <strong>
          {resetCount === 0
            ? "None"
            : `${resetCount} ${resetCount === 1 ? "exercise" : "exercises"}`}
        </strong>
      </div>
      <p className={styles.messageHelper}>
        Reset a specific exercise from its detail page when old logs should no
        longer guide future recommendations.
      </p>
    </SectionAccordion>
  );
};

type DataSettingsSectionProps = {
  canDeleteAllAppData: boolean;
  canDeleteWorkoutPlan: boolean;
  canResetProgramProgress: boolean;
  isDeletingAllAppData: boolean;
  isDeletingWorkoutPlan: boolean;
  isResettingProgramProgress: boolean;
  deleteAllAppDataError: string | null;
  deleteWorkoutPlanError: string | null;
  deleteWorkoutPlanMessage: string | null;
  resetProgramProgressError: string | null;
  resetProgramProgressMessage: string | null;
  onDeleteAllAppData: () => void;
  onDeleteWorkoutPlan: () => void;
  onResetProgramProgress: () => void;
};

export const DataSettingsSection = ({
  canDeleteAllAppData,
  canDeleteWorkoutPlan,
  canResetProgramProgress,
  isDeletingAllAppData,
  isDeletingWorkoutPlan,
  isResettingProgramProgress,
  deleteAllAppDataError,
  deleteWorkoutPlanError,
  deleteWorkoutPlanMessage,
  resetProgramProgressError,
  resetProgramProgressMessage,
  onDeleteAllAppData,
  onDeleteWorkoutPlan,
  onResetProgramProgress,
}: DataSettingsSectionProps) => (
  <SectionAccordion icon={<DataIcon />} title="Data">
    <div className={styles.dataActionPanel}>
      <div>
        <strong>Reset current program progress</strong>
        <p>
          Starts this program from a fresh progress version. Completed workout
          history stays saved, while in-progress sessions are abandoned.
        </p>
      </div>
      <Button
        disabled={!canResetProgramProgress || isResettingProgramProgress}
        icon="refresh"
        label={isResettingProgramProgress ? "Resetting..." : "Reset progress"}
        loading={isResettingProgramProgress}
        size="medium"
        tone="danger"
        variant="outline"
        onClick={onResetProgramProgress}
      />
    </div>
    {!canResetProgramProgress ? (
      <p className={styles.messageHelper}>
        Finish choosing and reviewing a program before resetting active progress.
      </p>
    ) : null}
    {resetProgramProgressError ? (
      <p className={styles.error}>{resetProgramProgressError}</p>
    ) : null}
    {resetProgramProgressMessage ? (
      <p className={styles.success}>{resetProgramProgressMessage}</p>
    ) : null}
    <div className={styles.dataActionPanel}>
      <div>
        <strong>Delete current workout plan</strong>
        <p>
          Removes the active plan and sends you back to the welcome flow.
          Completed workouts stay saved as historical training logs.
        </p>
      </div>
      <Button
        disabled={!canDeleteWorkoutPlan || isDeletingWorkoutPlan}
        label={isDeletingWorkoutPlan ? "Deleting..." : "Delete plan"}
        loading={isDeletingWorkoutPlan}
        size="medium"
        tone="danger"
        variant="outline"
        onClick={onDeleteWorkoutPlan}
      />
    </div>
    {!canDeleteWorkoutPlan ? (
      <p className={styles.messageHelper}>
        There is no active workout plan to delete right now.
      </p>
    ) : null}
    {deleteWorkoutPlanError ? (
      <p className={styles.error}>{deleteWorkoutPlanError}</p>
    ) : null}
    {deleteWorkoutPlanMessage ? (
      <p className={styles.success}>{deleteWorkoutPlanMessage}</p>
    ) : null}
    <div className={`${styles.dataActionPanel} ${styles.dataActionPanelCritical}`}>
      <div>
        <strong>Delete all LiftLogic app data</strong>
        <p>
          Permanently removes your LiftLogic profile, settings, workout plan,
          workout sessions, notes, badges, and app-specific history. This does
          not delete your Google account.
        </p>
      </div>
      <Button
        disabled={!canDeleteAllAppData || isDeletingAllAppData}
        label={isDeletingAllAppData ? "Deleting..." : "Delete all app data"}
        loading={isDeletingAllAppData}
        size="medium"
        tone="danger"
        onClick={onDeleteAllAppData}
      />
    </div>
    {!canDeleteAllAppData ? (
      <p className={styles.messageHelper}>
        Delete all app data is only available when your account is synced.
      </p>
    ) : null}
    {deleteAllAppDataError ? (
      <p className={styles.error}>{deleteAllAppDataError}</p>
    ) : null}
  </SectionAccordion>
);

type EquipmentSettingsSectionProps = {
  equipmentInventory: EquipmentItemId[];
  onEquipmentChange: (equipment: EquipmentItemId[]) => void;
};

export const EquipmentSettingsSection = ({
  equipmentInventory,
  onEquipmentChange,
}: EquipmentSettingsSectionProps) => (
  <SectionAccordion icon={<Dumbbell size={18} />} title="Equipment">
    <p className={styles.focusDescription}>
      Update the equipment you can use. Future plan recommendations and exercise
      substitutions will prefer this list.
    </p>
    <EquipmentInventoryPicker
      selectedEquipment={equipmentInventory}
      onChange={onEquipmentChange}
    />
  </SectionAccordion>
);

type PlateLoadingSettingsSectionProps = {
  draftSettings: UserSettings;
  onUpdateDraft: SettingsUpdate;
};

export const PlateLoadingSettingsSection = ({
  draftSettings,
  onUpdateDraft,
}: PlateLoadingSettingsSectionProps) => {
  const [customPlateSize, setCustomPlateSize] = useState("");
  const [customPlateError, setCustomPlateError] = useState<string | null>(null);
  const unit = draftSettings.plateLoading.unit;
  const activePlates = sortPlateInventory(draftSettings.plateLoading.plates[unit]);
  const customBarWeight = draftSettings.plateLoading.customBarbellWeight;
  const customBarError =
    draftSettings.plateLoading.barbellPreset === "custom" &&
    (!customBarWeight || customBarWeight <= 0)
      ? "Enter a positive bar weight before using a custom bar."
      : null;

  const updatePlateLoading = (
    updater: (plateLoading: UserSettings["plateLoading"]) => UserSettings["plateLoading"]
  ) => {
    onUpdateDraft((current) => ({
      ...current,
      plateLoading: updater(current.plateLoading),
    }));
  };

  const updatePlateCount = (size: number, count: number) => {
    const nextCount = Number.isFinite(count)
      ? Math.max(0, Math.min(100, Math.floor(count)))
      : 0;

    updatePlateLoading((plateLoading) => ({
      ...plateLoading,
      plates: {
        ...plateLoading.plates,
        [unit]: sortPlateInventory(
          plateLoading.plates[unit].map((plate) =>
            plate.size === size
              ? { ...plate, count: nextCount }
              : plate
          )
        ),
      },
    }));
  };

  const handleAddCustomPlate = () => {
    const size = parsePositiveNumber(customPlateSize);
    const existingPlate = activePlates.find((plate) => plate.size === size);

    if (!size) {
      setCustomPlateError("Enter a positive plate size.");
      return;
    }

    if (existingPlate) {
      setCustomPlateError("That plate size already exists. Update its count above.");
      return;
    }

    updatePlateLoading((plateLoading) => {
      const existingPlates = plateLoading.plates[unit];
      const nextPlates = [...existingPlates, { count: 2, size }];

      return {
        ...plateLoading,
        plates: {
          ...plateLoading.plates,
          [unit]: sortPlateInventory(nextPlates),
        },
      };
    });
    setCustomPlateSize("");
    setCustomPlateError(null);
  };

  const handleRemovePlate = (size: number) => {
    updatePlateLoading((plateLoading) => ({
      ...plateLoading,
      plates: {
        ...plateLoading.plates,
        [unit]: plateLoading.plates[unit].filter((plate) => plate.size !== size),
      },
    }));
  };

  return (
    <SectionAccordion
      icon={<CircleDot size={18} />}
      title="Plate Loading"
      id="plate-loading"
    >
      <p className={styles.focusDescription}>
        Save the bar and plates you normally train with so the workout calculator
        can open ready to load the next set.
      </p>

      <div className={styles.plateControlGroup}>
        <span>Loading unit</span>
        <div className={styles.segmentedControl}>
          {plateLoadingUnitOptions.map((option) => (
            <button
              key={option.value}
              aria-pressed={unit === option.value}
              type="button"
              onClick={() =>
                updatePlateLoading((plateLoading) => ({
                  ...plateLoading,
                  unit: option.value,
                }))
              }
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.plateControlGroup}>
        <span>Barbell</span>
        <div className={styles.barbellPresetGrid}>
          {barbellPresetOptions.map((option) => (
            <button
              key={option.value}
              aria-pressed={draftSettings.plateLoading.barbellPreset === option.value}
              type="button"
              onClick={() =>
                updatePlateLoading((plateLoading) => ({
                  ...plateLoading,
                  barbellPreset: option.value,
                }))
              }
            >
              <strong>{option.label}</strong>
              <small>{option.description}</small>
            </button>
          ))}
        </div>
      </div>

      {draftSettings.plateLoading.barbellPreset === "custom" ? (
        <div className={styles.validationGroup}>
          <FormField label={`Custom bar weight (${unit})`}>
            <TextInput
              min="1"
              step={unit === "kg" ? "0.5" : "1"}
              type="number"
              value={toNumberInputValue(
                draftSettings.plateLoading.customBarbellWeight
              )}
              onChange={(event) => {
                const nextValue = parsePositiveNumber(event.target.value);
                updatePlateLoading((plateLoading) => ({
                  ...plateLoading,
                  customBarbellWeight: nextValue,
                }));
              }}
            />
          </FormField>
          {customBarError ? (
            <p className={styles.inputError}>{customBarError}</p>
          ) : null}
        </div>
      ) : null}

      <div className={styles.plateInventoryHeader}>
        <div>
          <strong>Plate inventory</strong>
          <span>Total plates on hand</span>
        </div>
        <span>{unit}</span>
      </div>

      <div className={styles.plateInventoryList}>
        {activePlates.length > 0 ? (
          activePlates.map((plate) => (
            <div key={`${unit}-${plate.size}`} className={styles.plateInventoryRow}>
              <div>
                <strong>
                  {plate.size}
                  {unit}
                </strong>
                <span>{Math.floor(plate.count / 2)} balanced pairs</span>
              </div>
              <div className={styles.plateStepper}>
                <button
                  aria-label={`Remove one ${plate.size}${unit} plate`}
                  type="button"
                  onClick={() => updatePlateCount(plate.size, plate.count - 1)}
                >
                  <Minus size={16} />
                </button>
                <input
                  min="0"
                  max="100"
                  step="1"
                  type="number"
                  value={plate.count}
                  aria-label={`${plate.size}${unit} plate count`}
                  onChange={(event) =>
                    updatePlateCount(plate.size, Number(event.target.value))
                  }
                />
                <button
                  aria-label={`Add one ${plate.size}${unit} plate`}
                  type="button"
                  onClick={() => updatePlateCount(plate.size, plate.count + 1)}
                >
                  <Plus size={16} />
                </button>
                <button
                  className={styles.removePlateButton}
                  type="button"
                  onClick={() => handleRemovePlate(plate.size)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className={styles.plateEmptyState}>
            No {unit} plates saved yet. Add your first plate below.
          </p>
        )}
      </div>

      <div className={styles.customPlateRow}>
        <FormField label={`Add custom ${unit} plate`}>
          <TextInput
            min="0"
            step={unit === "kg" ? "0.25" : "0.5"}
            type="number"
            value={customPlateSize}
            onChange={(event) => {
              setCustomPlateSize(event.target.value);
              setCustomPlateError(null);
            }}
          />
        </FormField>
        <Button
          label="Add plate"
          size="medium"
          tone="secondary"
          variant="outline"
          onClick={handleAddCustomPlate}
        />
      </div>
      {customPlateError ? (
        <p className={styles.inputError}>{customPlateError}</p>
      ) : null}
    </SectionAccordion>
  );
};

type AppearanceSettingsSectionProps = {
  draftSettings: UserSettings;
  onResetTheme: () => void;
  onUpdateDraft: SettingsUpdate;
};

export const AppearanceSettingsSection = ({
  draftSettings,
  onResetTheme,
  onUpdateDraft,
}: AppearanceSettingsSectionProps) => {
  const updateThemeColor = (
    key: keyof UserSettings["theme"],
    value: string
  ) => {
    onUpdateDraft((current) => ({
      ...current,
      theme: {
        ...current.theme,
        [key]: value,
      },
    }));
  };

  return (
    <SectionAccordion icon={<AppearanceIcon aria-hidden="true" />} title="Appearance">
      <div className={styles.colorGrid}>
        <label className={styles.colorField}>
          <span>Primary</span>
          <input
            type="color"
            value={draftSettings.theme.primaryColor}
            onChange={(event) =>
              updateThemeColor("primaryColor", event.target.value)
            }
          />
        </label>
        <label className={styles.colorField}>
          <span>Secondary</span>
          <input
            type="color"
            value={draftSettings.theme.secondaryColor}
            onChange={(event) =>
              updateThemeColor("secondaryColor", event.target.value)
            }
          />
        </label>
      </div>

      <Button
        icon="refresh"
        label="Reset colors"
        size="medium"
        tone="gray"
        variant="outline"
        onClick={onResetTheme}
      />
    </SectionAccordion>
  );
};

type AccountSettingsSectionProps = {
  accountLabel: string;
  emailLabel: string;
  onSignOut: () => void;
};

export const AccountSettingsSection = ({
  accountLabel,
  emailLabel,
  onSignOut,
}: AccountSettingsSectionProps) => (
  <SectionAccordion icon={<AccountIcon aria-hidden="true" />} title="Account">
    <div className={styles.summaryRow}>
      <span>Name</span>
      <strong>{accountLabel}</strong>
    </div>
    <div className={styles.summaryRow}>
      <span>Email</span>
      <strong>{emailLabel}</strong>
    </div>
    <Button
      icon="exit"
      label="Sign out"
      size="large"
      tone="danger"
      variant="outline"
      onClick={onSignOut}
    />
  </SectionAccordion>
);
