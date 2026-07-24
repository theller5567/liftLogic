import type { UserSettings } from "../../../../shared/types/userSettings.types";
import HistoryIcon from "../../assets/icons/file.svg?react";
import SectionAccordion from "../ui/SectionAccordion";
import type { SettingsUpdate } from "./settingsSectionTypes";
import styles from "../../styles/pages/settings.module.scss";

type ExerciseHistorySettingsSectionProps = {
  draftSettings: UserSettings;
  onUpdateDraft: SettingsUpdate;
};

export const ExerciseHistorySettingsSection = ({
  draftSettings,
  onUpdateDraft,
}: ExerciseHistorySettingsSectionProps) => {
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
