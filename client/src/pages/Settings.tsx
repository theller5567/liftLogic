import { ChevronDown, RotateCcw, SlidersHorizontal, Target } from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import {
  WORKOUT_FOCUS_AREA_LABELS,
  WORKOUT_FOCUS_DURATION_WEEKS,
  type WorkoutFocusArea,
  type WorkoutFocusBlock,
} from "../../../shared/types/workoutFocus.types";
import {
  getWorkoutFocusLabel,
  isWorkoutFocusBlockActive,
} from "../../../shared/utils/workoutFocus";
import {
  DEFAULT_THEME_SETTINGS,
  createDefaultUserSettings,
  mergeUserSettings,
  type UserSettings,
  type WeightStepKey,
} from "../../../shared/types/userSettings.types";
import AppShell from "../components/app/AppShell";
import Button from "../components/Button";
import { useAuth } from "../context/useAuth";
import {
  clearWorkoutFocusBlock,
  isApiEnabled,
  type WorkoutPlanDto,
} from "../services/api";
import { useUserFlow } from "../utils/userFlow";
import {
  applyUserTheme,
  resetUserTheme,
  useUserSettings,
} from "../utils/userSettings";
import {
  readWorkoutFocusBlock,
  writePendingWorkoutFocusBlock,
  writeWorkoutFocusBlock,
} from "../utils/workoutStorage";
import styles from "../styles/pages/settings.module.scss";

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

const focusAreaOptions = Object.entries(WORKOUT_FOCUS_AREA_LABELS).map(
  ([value, label]) => ({
    label,
    value: value as WorkoutFocusArea,
  })
);

const formatFocusDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(value));

type SettingsFormProps = {
  initialSettings: UserSettings;
  isSettingsLoading: boolean;
  settingsError: Error | null;
  saveSettings: (settings: UserSettings) => Promise<UserSettings>;
};

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

const SettingsForm = ({
  initialSettings,
  isSettingsLoading,
  saveSettings,
  settingsError,
}: SettingsFormProps) => {
  const navigate = useNavigate();
  const apiEnabled = isApiEnabled();
  const { signOut, user } = useAuth();
  const { profile, workoutPlan } = useUserFlow();
  const [workoutPlanOverride, setWorkoutPlanOverride] =
    useState<WorkoutPlanDto | null>(null);
  const [draftSettings, setDraftSettings] =
    useState<UserSettings>(initialSettings);
  const [selectedFocusArea, setSelectedFocusArea] =
    useState<WorkoutFocusArea>("glutes");
  const [selectedFocusDuration, setSelectedFocusDuration] =
    useState<WorkoutFocusBlock["durationWeeks"]>(4);
  const [focusMessage, setFocusMessage] = useState<string | null>(null);
  const [focusError, setFocusError] = useState<string | null>(null);
  const [isSavingFocus, setIsSavingFocus] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const currentWorkoutPlan = workoutPlanOverride ?? workoutPlan;
  const localFocusBlock = apiEnabled ? null : readWorkoutFocusBlock();
  const activeFocusBlock = currentWorkoutPlan?.focusBlock ?? localFocusBlock;
  const isFocusActive = isWorkoutFocusBlockActive(activeFocusBlock);

  useEffect(() => {
    applyUserTheme(draftSettings);
  }, [draftSettings]);

  const accountLabel = useMemo(
    () =>
      profile?.displayName ??
      user?.displayName ??
      profile?.email ??
      user?.email ??
      "LiftLogic athlete",
    [profile, user]
  );

  const updateDraft = (updater: (current: UserSettings) => UserSettings) => {
    setSaveMessage(null);
    setSaveError(null);
    setDraftSettings((current) => updater(current));
  };

  const updateWeightStep = (key: WeightStepKey, value: string) => {
    const nextValue = Number(value);

    updateDraft((current) => ({
      ...current,
      weightSteps: {
        ...current.weightSteps,
        [key]: Number.isFinite(nextValue) && nextValue > 0 ? nextValue : 0,
      },
    }));
  };

  const updateThemeColor = (
    key: keyof UserSettings["theme"],
    event: ChangeEvent<HTMLInputElement>
  ) => {
    updateDraft((current) => ({
      ...current,
      theme: {
        ...current.theme,
        [key]: event.target.value,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const savedSettings = await saveSettings(mergeUserSettings(draftSettings));
      setDraftSettings(savedSettings);
      setSaveMessage("Settings saved.");
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "We could not save settings."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetTheme = () => {
    resetUserTheme();
    updateDraft((current) => ({
      ...current,
      theme: {
        ...DEFAULT_THEME_SETTINGS,
      },
    }));
  };

  const handleResetDefaults = () => {
    const defaultSettings = createDefaultUserSettings(
      workoutPlan?.onboardingAnswers
    );
    updateDraft(() => defaultSettings);
  };

  const handleRedoOnboarding = () => {
    navigate("/onboarding?redo=1");
  };

  const handleStartFocusBlock = () => {
    setFocusError(null);
    setFocusMessage(null);
    writePendingWorkoutFocusBlock({
      durationWeeks: selectedFocusDuration,
      focusArea: selectedFocusArea,
    });
    navigate("/focus-review");
  };

  const handleClearFocusBlock = async () => {
    setIsSavingFocus(true);
    setFocusError(null);
    setFocusMessage(null);

    try {
      if (apiEnabled) {
        const { workoutPlan: nextWorkoutPlan } = await clearWorkoutFocusBlock();
        setWorkoutPlanOverride(nextWorkoutPlan);
      } else {
        writeWorkoutFocusBlock(null);
      }

      setFocusMessage("Specialization block cleared.");
    } catch (error) {
      setFocusError(
        error instanceof Error
          ? error.message
          : "We could not clear your focus block."
      );
    } finally {
      setIsSavingFocus(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <AppShell>
      <section className={styles.settingsPage}>
        <header className={styles.header}>
          <div>
            <p>Set Up</p>
            <h1>Settings</h1>
          </div>
          <Button
            disabled={isSaving}
            icon="refresh"
            label="Reset"
            size="medium"
            tone="gray"
            variant="outline"
            onClick={handleResetDefaults}
          />
        </header>

        {settingsError ? (
          <p className={styles.error}>Settings could not load from the API.</p>
        ) : null}
        {saveError ? <p className={styles.error}>{saveError}</p> : null}
        {saveMessage ? <p className={styles.success}>{saveMessage}</p> : null}

        <div className={styles.sectionGrid}>
        <SettingsAccordion defaultOpen icon={<RotateCcw size={18} />} title="Program">
          <div className={styles.summaryRow}>
              <span>Workout Plan</span>
              <strong>
                {currentWorkoutPlan?.suggestedPreview.label ?? "Not set"}
              </strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Current goal</span>
              <strong>
                {currentWorkoutPlan?.onboardingAnswers.goal ?? "Not set"}
              </strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Equipment</span>
              <strong>
                {currentWorkoutPlan?.onboardingAnswers.equipmentAccess ??
                  "Not set"}
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
                Priority muscle groups are trained at least 3 times per week, or
                every workout on shorter plans.
              </p>
              <div className={styles.focusControls}>
                <label className={styles.field}>
                  <span>Focus area</span>
                  <select
                    value={selectedFocusArea}
                    onChange={(event) =>
                      setSelectedFocusArea(event.target.value as WorkoutFocusArea)
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
                      setSelectedFocusDuration(
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
                  onClick={handleStartFocusBlock}
                />
                <Button
                  disabled={isSavingFocus || !isFocusActive}
                  label="Clear"
                  size="medium"
                  tone="gray"
                  variant="outline"
                  onClick={handleClearFocusBlock}
                />
              </div>
              {focusError ? <p className={styles.error}>{focusError}</p> : null}
              {focusMessage ? (
                <p className={styles.success}>{focusMessage}</p>
              ) : null}
            </div>
            <Button
              label="Redo onboarding"
              size="large"
              tone="secondary"
              onClick={handleRedoOnboarding}
            />
          </SettingsAccordion>

          <SettingsAccordion
            icon={<SlidersHorizontal size={18} />}
            title="Training"
          >
            <label className={styles.field}>
              <span>Weight unit</span>
              <select
                value={draftSettings.weightUnit}
                onChange={(event) =>
                  updateDraft((current) => ({
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
                    value={toNumberInputValue(
                      draftSettings.weightSteps[field.key]
                    )}
                    onChange={(event) =>
                      updateWeightStep(field.key, event.target.value)
                    }
                  />
                </label>
              ))}
            </div>
          </SettingsAccordion>

          <SettingsAccordion
            icon={<SlidersHorizontal size={18} />}
            title="Rest Timer"
          >
            <label className={styles.toggleRow}>
              <span>Auto-start after set</span>
              <input
                checked={draftSettings.restTimer.autoStartAfterSet}
                type="checkbox"
                onChange={(event) =>
                  updateDraft((current) => ({
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
                value={toNumberInputValue(
                  draftSettings.restTimer.defaultSeconds
                )}
                onChange={(event) => {
                  const nextValue = Number(event.target.value);
                  updateDraft((current) => ({
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

          <SettingsAccordion
            icon={<SlidersHorizontal size={18} />}
            title="Appearance"
          >
            <div className={styles.colorGrid}>
              <label className={styles.colorField}>
                <span>Primary</span>
                <input
                  type="color"
                  value={draftSettings.theme.primaryColor}
                  onChange={(event) => updateThemeColor("primaryColor", event)}
                />
              </label>
              <label className={styles.colorField}>
                <span>Secondary</span>
                <input
                  type="color"
                  value={draftSettings.theme.secondaryColor}
                  onChange={(event) => updateThemeColor("secondaryColor", event)}
                />
              </label>
            </div>

            <Button
              icon="refresh"
              label="Reset colors"
              size="medium"
              tone="gray"
              variant="outline"
              onClick={handleResetTheme}
            />
          </SettingsAccordion>

          <SettingsAccordion
            icon={<SlidersHorizontal size={18} />}
            title="Account"
          >
            <div className={styles.summaryRow}>
              <span>Name</span>
              <strong>{accountLabel}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Email</span>
              <strong>{profile?.email ?? user?.email ?? "Not connected"}</strong>
            </div>
            <Button
              label="Sign out"
              size="medium"
              tone="gray"
              variant="outline"
              onClick={handleSignOut}
            />
          </SettingsAccordion>
        </div>

        <div className={styles.footerActions}>
          <Button
            disabled={isSaving || isSettingsLoading}
            icon={isSaving ? undefined : "edit"}
            label={isSaving ? "Saving..." : "Save settings"}
            size="large"
            tone="primary"
            onClick={handleSave}
          />
        </div>
      </section>
    </AppShell>
  );
};

const Settings = () => {
  const {
    error: settingsError,
    isLoading: isSettingsLoading,
    saveSettings,
    settings,
  } = useUserSettings();

  return (
    <SettingsForm
      key={JSON.stringify(settings)}
      initialSettings={settings}
      isSettingsLoading={isSettingsLoading}
      saveSettings={saveSettings}
      settingsError={settingsError}
    />
  );
};

export default Settings;
