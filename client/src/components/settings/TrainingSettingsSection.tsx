import type {
  UserSettings,
  WeightStepKey,
} from "../../../../shared/types/userSettings.types";
import TrainingIcon from "../../assets/icons/003-weightlifting.svg?react";
import FormField, { SelectInput, TextInput } from "../ui/FormField";
import SectionAccordion from "../ui/SectionAccordion";
import type { SettingsUpdate } from "./settingsSectionTypes";
import {
  toNumberInputValue,
  weightStepFields,
} from "./settingsSectionUtils";
import styles from "../../styles/pages/settings.module.scss";

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
