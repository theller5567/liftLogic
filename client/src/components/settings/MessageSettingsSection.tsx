import { useState } from "react";
import { Bell } from "lucide-react";

import type {
  UserMessageCategory,
  UserMessageFrequency,
  UserMessageSurface,
  UserSettings,
} from "../../../../shared/types/userSettings.types";
import Button from "../Button";
import FormField, { SelectInput } from "../ui/FormField";
import SectionAccordion from "../ui/SectionAccordion";
import type { SettingsUpdate } from "./settingsSectionTypes";
import {
  addDaysIso,
  formatFocusDate,
  messageCategoryOptions,
  messageFrequencyOptions,
  messageSurfaceOptions,
} from "./settingsSectionUtils";
import styles from "../../styles/pages/settings.module.scss";

type MessageSettingsSectionProps = {
  draftSettings: UserSettings;
  onUpdateDraft: SettingsUpdate;
};

export const MessageSettingsSection = ({
  draftSettings,
  onUpdateDraft,
}: MessageSettingsSectionProps) => {
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
