import type { UserSettings } from "../../../../shared/types/userSettings.types";
import RestTimerIcon from "../../assets/icons/005-cooldown.svg?react";
import FormField, { TextInput } from "../ui/FormField";
import SectionAccordion from "../ui/SectionAccordion";
import type { SettingsUpdate } from "./settingsSectionTypes";
import { toNumberInputValue } from "./settingsSectionUtils";
import styles from "../../styles/pages/settings.module.scss";

type RestTimerSettingsSectionProps = {
  draftSettings: UserSettings;
  onUpdateDraft: SettingsUpdate;
};

export const RestTimerSettingsSection = ({
  draftSettings,
  onUpdateDraft,
}: RestTimerSettingsSectionProps) => (
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
