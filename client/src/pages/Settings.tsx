import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  WORKOUT_FOCUS_AREA_LABELS,
  type WorkoutFocusArea,
  type WorkoutFocusBlock,
} from "../../../shared/types/workoutFocus.types";
import { getAvailableEquipmentFromSettings } from "../../../shared/utils/equipmentRequirements";
import {
  DEFAULT_THEME_SETTINGS,
  createDefaultUserSettings,
  mergeUserSettings,
  type UserSettings,
} from "../../../shared/types/userSettings.types";
import AppShell from "../components/app/AppShell";
import Button from "../components/Button";
import {
  AccountSettingsSection,
  AppearanceSettingsSection,
  EquipmentSettingsSection,
  ProgramSettingsSection,
  RestTimerSettingsSection,
  TrainingSettingsSection,
} from "../components/settings/SettingsSections";
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

const focusAreaOptions = Object.entries(WORKOUT_FOCUS_AREA_LABELS).map(
  ([value, label]) => ({
    label,
    value: value as WorkoutFocusArea,
  })
);

type SettingsFormProps = {
  initialSettings: UserSettings;
  isSettingsLoading: boolean;
  settingsError: Error | null;
  saveSettings: (settings: UserSettings) => Promise<UserSettings>;
};

type DraftSettingsState = {
  draft: UserSettings;
  source: UserSettings;
};

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
  const [draftSettingsState, setDraftSettingsState] =
    useState<DraftSettingsState>(() => ({
      draft: initialSettings,
      source: initialSettings,
    }));
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
  const draftSettings =
    draftSettingsState.source === initialSettings
      ? draftSettingsState.draft
      : initialSettings;

  if (draftSettingsState.source !== initialSettings) {
    setDraftSettingsState({
      draft: initialSettings,
      source: initialSettings,
    });
  }

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
    setDraftSettingsState((current) => {
      const source = current.source === initialSettings ? current.source : initialSettings;
      const draft = current.source === initialSettings ? current.draft : initialSettings;

      return {
        draft: updater(draft),
        source,
      };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const savedSettings = await saveSettings(mergeUserSettings(draftSettings));
      setDraftSettingsState({
        draft: savedSettings,
        source: savedSettings,
      });
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

  const emailLabel = profile?.email ?? user?.email ?? "Not connected";
  const equipmentInventory = getAvailableEquipmentFromSettings(
    draftSettings,
    currentWorkoutPlan?.onboardingAnswers
  );

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
          <ProgramSettingsSection
            activeFocusBlock={activeFocusBlock}
            currentWorkoutPlan={currentWorkoutPlan}
            focusAreaOptions={focusAreaOptions}
            focusError={focusError}
            focusMessage={focusMessage}
            isSavingFocus={isSavingFocus}
            selectedFocusArea={selectedFocusArea}
            selectedFocusDuration={selectedFocusDuration}
            onClearFocusBlock={handleClearFocusBlock}
            onFocusAreaChange={setSelectedFocusArea}
            onFocusDurationChange={setSelectedFocusDuration}
            onRedoOnboarding={handleRedoOnboarding}
            onStartFocusBlock={handleStartFocusBlock}
          />
          <TrainingSettingsSection
            draftSettings={draftSettings}
            onUpdateDraft={updateDraft}
          />
          <RestTimerSettingsSection
            draftSettings={draftSettings}
            onUpdateDraft={updateDraft}
          />
          <EquipmentSettingsSection
            equipmentInventory={equipmentInventory}
            onEquipmentChange={(equipmentInventory) =>
              updateDraft((current) => ({
                ...current,
                equipmentInventory,
              }))
            }
          />
          <AppearanceSettingsSection
            draftSettings={draftSettings}
            onResetTheme={handleResetTheme}
            onUpdateDraft={updateDraft}
          />
          <AccountSettingsSection
            accountLabel={accountLabel}
            emailLabel={emailLabel}
            onSignOut={handleSignOut}
          />
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
      initialSettings={settings}
      isSettingsLoading={isSettingsLoading}
      saveSettings={saveSettings}
      settingsError={settingsError}
    />
  );
};

export default Settings;
