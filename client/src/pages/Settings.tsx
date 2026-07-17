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
import PageHeader from "../components/ui/PageHeader";
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
import { updateCachedCurrentAppData } from "../utils/appDataCache";
import {
  applyUserTheme,
  resetUserTheme,
  useUserSettings,
} from "../utils/userSettings";
import BottomSheet from "../components/BottomSheet";
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

const getComparableSettings = (settings: UserSettings) => ({
  ...mergeUserSettings(settings),
  equipmentInventory: [...(settings.equipmentInventory ?? [])].sort(),
});

const areSettingsEqual = (left: UserSettings, right: UserSettings) =>
  JSON.stringify(getComparableSettings(left)) ===
  JSON.stringify(getComparableSettings(right));

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
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);

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
        updateCachedCurrentAppData({ workoutPlan: nextWorkoutPlan });
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
    setSignOutConfirmOpen(false);
    await signOut();
    navigate("/", { replace: true });
  };

  const emailLabel = profile?.email ?? user?.email ?? "Not connected";
  const equipmentInventory = getAvailableEquipmentFromSettings(
    draftSettings,
    currentWorkoutPlan?.onboardingAnswers
  );
  const hasUnsavedSettingsChanges = !areSettingsEqual(
    draftSettings,
    draftSettingsState.source
  );

  return (
    <AppShell>
      <section className={styles.settingsPage}>
        <PageHeader
          eyebrow="Set Up"
          title="Settings"
          action={<Button
            disabled={isSaving}
            icon="refresh"
            label="Reset"
            size="medium"
            tone="gray"
            variant="outline"
            onClick={handleResetDefaults}
          />}
        />

        {settingsError ? (
          <p className={styles.error}>Settings could not load from the API.</p>
        ) : null}
        {saveError ? <p className={styles.error}>{saveError}</p> : null}
        {saveMessage ? <p className={styles.success}>{saveMessage}</p> : null}

        <div className={styles.settingsOverview}>
          <div>
            <span>Quick settings</span>
            <strong>{hasUnsavedSettingsChanges ? "Unsaved changes" : "Everything is current"}</strong>
          </div>
          <p>
            Account and equipment are first because they affect access,
            recommendations, and exercise substitutions.
          </p>
        </div>

        <div className={styles.sectionGrid}>
          <AccountSettingsSection
            accountLabel={accountLabel}
            emailLabel={emailLabel}
            onSignOut={() => setSignOutConfirmOpen(true)}
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
          <AppearanceSettingsSection
            draftSettings={draftSettings}
            onResetTheme={handleResetTheme}
            onUpdateDraft={updateDraft}
          />
        </div>

        <div
          className={styles.saveState}
          data-state={
            saveError
              ? "error"
              : isSaving
                ? "saving"
                : hasUnsavedSettingsChanges
                  ? "dirty"
                  : "clean"
          }
        >
          <strong>
            {saveError
              ? "Save failed"
              : isSaving
                ? "Saving settings..."
                : hasUnsavedSettingsChanges
                  ? "You have unsaved changes"
                  : "No changes to save"}
          </strong>
          <span>
            {saveError
              ? "Review the message above, then try saving again."
              : isSaving
                ? "Keep this page open while your settings sync."
                : hasUnsavedSettingsChanges
                  ? "Save when you are ready to apply these updates."
                  : "Changes you make here will enable the save button."}
          </span>
        </div>

        <div className={styles.footerActions}>
          <Button
            disabled={isSaving || isSettingsLoading || !hasUnsavedSettingsChanges}
            icon={!isSaving && hasUnsavedSettingsChanges ? "edit" : undefined}
            label={
              isSaving
                ? "Saving..."
                : hasUnsavedSettingsChanges
                  ? "Save settings"
                  : "No changes to save"
            }
            size="large"
            tone={hasUnsavedSettingsChanges ? "primary" : "gray"}
            variant={hasUnsavedSettingsChanges ? undefined : "outline"}
            onClick={handleSave}
          />
        </div>
        <BottomSheet
          open={signOutConfirmOpen}
          onClose={() => setSignOutConfirmOpen(false)}
          eyebrow="Sign Out"
          title="Sign out of LiftLogic?"
          description="You can sign back in with Google whenever you are ready."
          actions={[
            {
              label: "Cancel",
              tone: "white",
              variant: "outline",
            },
            {
              label: "Sign out",
              tone: "danger",
              variant: "outline",
              icon: "exit",
              iconSize: "large",
              onClick: handleSignOut,
            },
          ]}
        >
          <p className={styles.warningMessage}>
            Any unsaved settings changes may be lost before you leave this session.
          </p>
        </BottomSheet>
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
