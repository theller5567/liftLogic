import { ChevronDown, Dumbbell, RotateCcw, SlidersHorizontal, Target } from "lucide-react";
import type { ReactNode } from "react";

import type { WorkoutPlanDto } from "../../services/api";
import EquipmentInventoryPicker from "../EquipmentInventoryPicker";
import type { EquipmentItemId } from "../../../../shared/constants/equipmentCatalog";
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
  UserSettings,
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

const toNumberInputValue = (value: number | undefined) =>
  value === undefined ? "" : String(value);

const formatFocusDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(value));

type SettingsAccordionProps = {
  children: ReactNode;
  defaultOpen?: boolean;
  icon: ReactNode;
  title: string;
};

const SettingsAccordion = ({
  children,
  defaultOpen = false,
  icon,
  title,
}: SettingsAccordionProps) => (
  <details className={styles.settingsSection} open={defaultOpen}>
    <summary className={styles.sectionHeader}>
      <span className={styles.sectionHeaderTitle}>
        {icon}
        <h2>{title}</h2>
      </span>
      <ChevronDown className={styles.accordionIcon} aria-hidden="true" size={18} />
    </summary>
    <div className={styles.sectionContent}>{children}</div>
  </details>
);

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

  return (
    <SettingsAccordion defaultOpen icon={<RotateCcw size={18} />} title="Program">
      <div className={styles.summaryRow}>
        <span>Workout Plan</span>
        <strong>{currentWorkoutPlan?.suggestedPreview.label ?? "Not set"}</strong>
      </div>
      <div className={styles.summaryRow}>
        <span>Current goal</span>
        <strong>{currentWorkoutPlan?.onboardingAnswers.goal ?? "Not set"}</strong>
      </div>
      <div className={styles.summaryRow}>
        <span>Equipment</span>
        <strong>
          {currentWorkoutPlan?.onboardingAnswers.equipmentAccess ?? "Not set"}
        </strong>
      </div>
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
          <label className={styles.field}>
            <span>Focus area</span>
            <select
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
            </select>
          </label>
          <label className={styles.field}>
            <span>Duration</span>
            <select
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
            </select>
          </label>
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
    </SettingsAccordion>
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
    <SettingsAccordion icon={<SlidersHorizontal size={18} />} title="Training">
      <label className={styles.field}>
        <span>Weight unit</span>
        <select
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
        </select>
      </label>

      <div className={styles.stepGrid}>
        {weightStepFields.map((field) => (
          <label key={field.key} className={styles.field}>
            <span>{field.label} step</span>
            <input
              min="0"
              step="0.5"
              type="number"
              value={toNumberInputValue(draftSettings.weightSteps[field.key])}
              onChange={(event) => updateWeightStep(field.key, event.target.value)}
            />
          </label>
        ))}
      </div>
    </SettingsAccordion>
  );
};

export const RestTimerSettingsSection = ({
  draftSettings,
  onUpdateDraft,
}: TrainingSettingsSectionProps) => (
  <SettingsAccordion icon={<SlidersHorizontal size={18} />} title="Rest Timer">
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

    <label className={styles.field}>
      <span>Default seconds</span>
      <input
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
    </label>
  </SettingsAccordion>
);

type EquipmentSettingsSectionProps = {
  equipmentInventory: EquipmentItemId[];
  onEquipmentChange: (equipment: EquipmentItemId[]) => void;
};

export const EquipmentSettingsSection = ({
  equipmentInventory,
  onEquipmentChange,
}: EquipmentSettingsSectionProps) => (
  <SettingsAccordion icon={<Dumbbell size={18} />} title="Equipment">
    <p className={styles.focusDescription}>
      Update the equipment you can use. Future plan recommendations and exercise
      substitutions will prefer this list.
    </p>
    <EquipmentInventoryPicker
      selectedEquipment={equipmentInventory}
      onChange={onEquipmentChange}
    />
  </SettingsAccordion>
);

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
    <SettingsAccordion icon={<SlidersHorizontal size={18} />} title="Appearance">
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
    </SettingsAccordion>
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
  <SettingsAccordion icon={<SlidersHorizontal size={18} />} title="Account">
    <div className={styles.summaryRow}>
      <span>Name</span>
      <strong>{accountLabel}</strong>
    </div>
    <div className={styles.summaryRow}>
      <span>Email</span>
      <strong>{emailLabel}</strong>
    </div>
    <Button
      label="Sign out"
      size="medium"
      tone="gray"
      variant="outline"
      onClick={onSignOut}
    />
  </SettingsAccordion>
);
