import type { UserSettings } from "../../../../shared/types/userSettings.types";
import AppearanceIcon from "../../assets/icons/012-theme.svg?react";
import Button from "../Button";
import SectionAccordion from "../ui/SectionAccordion";
import type { SettingsUpdate } from "./settingsSectionTypes";
import styles from "../../styles/pages/settings.module.scss";

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
