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
  DataSettingsSection,
  EquipmentSettingsSection,
  ExerciseHistorySettingsSection,
  MessageSettingsSection,
  PlateLoadingSettingsSection,
  ProgramSettingsSection,
  RestTimerSettingsSection,
  TrainingSettingsSection,
} from "../components/settings/SettingsSections";
import { useAuth } from "../context/useAuth";
import {
  clearWorkoutFocusBlock,
  deleteAllAppData,
  deleteCurrentWorkoutPlan,
  isApiEnabled,
  resetCurrentProgramProgress,
  type WorkoutPlanDto,
} from "../services/api";
import { useUserFlow } from "../utils/userFlow";
import { updateCachedCurrentAppData } from "../utils/appDataCache";
import {
  applyUserTheme,
  resetUserTheme,
  useUserSettings,
} from "../utils/userSettings";
import { clearUserMessageVisibilityState } from "../utils/userMessageVisibility";
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
  const [resetProgramConfirmOpen, setResetProgramConfirmOpen] = useState(false);
  const [deleteWorkoutPlanConfirmOpen, setDeleteWorkoutPlanConfirmOpen] =
    useState(false);
  const [deleteAllAppDataConfirmOpen, setDeleteAllAppDataConfirmOpen] =
    useState(false);
  const [isResettingProgramProgress, setIsResettingProgramProgress] =
    useState(false);
  const [isDeletingWorkoutPlan, setIsDeletingWorkoutPlan] = useState(false);
  const [isDeletingAllAppData, setIsDeletingAllAppData] = useState(false);
  const [resetProgramProgressError, setResetProgramProgressError] =
    useState<string | null>(null);
  const [resetProgramProgressMessage, setResetProgramProgressMessage] =
    useState<string | null>(null);
  const [deleteWorkoutPlanError, setDeleteWorkoutPlanError] =
    useState<string | null>(null);
  const [deleteWorkoutPlanMessage, setDeleteWorkoutPlanMessage] =
    useState<string | null>(null);
  const [deleteAllAppDataError, setDeleteAllAppDataError] =
    useState<string | null>(null);
  const [deleteAllAppDataConfirmationText, setDeleteAllAppDataConfirmationText] =
    useState("");

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

  const handleResetProgramProgress = async () => {
    if (!apiEnabled || !currentWorkoutPlan) {
      setResetProgramProgressError(
        "Program progress reset is only available after your program is saved."
      );
      return;
    }

    setIsResettingProgramProgress(true);
    setResetProgramProgressError(null);
    setResetProgramProgressMessage(null);

    try {
      const {
        abandonedWorkoutSessionCount,
        workoutPlan: nextWorkoutPlan,
      } = await resetCurrentProgramProgress();

      setWorkoutPlanOverride(nextWorkoutPlan);
      updateCachedCurrentAppData({ workoutPlan: nextWorkoutPlan });
      setResetProgramConfirmOpen(false);
      setResetProgramProgressMessage(
        abandonedWorkoutSessionCount > 0
          ? `Current program progress reset. ${abandonedWorkoutSessionCount} in-progress session${
              abandonedWorkoutSessionCount === 1 ? "" : "s"
            } moved out of your active progress.`
          : "Current program progress reset. Completed history is still saved."
      );
    } catch (error) {
      setResetProgramProgressError(
        error instanceof Error
          ? error.message
          : "We could not reset your program progress."
      );
    } finally {
      setIsResettingProgramProgress(false);
    }
  };

  const handleDeleteWorkoutPlan = async () => {
    if (!apiEnabled || !currentWorkoutPlan) {
      setDeleteWorkoutPlanError("There is no active workout plan to delete.");
      return;
    }

    setIsDeletingWorkoutPlan(true);
    setDeleteWorkoutPlanError(null);
    setDeleteWorkoutPlanMessage(null);

    try {
      await deleteCurrentWorkoutPlan();

      setWorkoutPlanOverride(null);
      updateCachedCurrentAppData({ workoutPlan: null });
      setDeleteWorkoutPlanConfirmOpen(false);
      setDeleteWorkoutPlanMessage("Current workout plan deleted.");
      navigate("/welcome", { replace: true });
    } catch (error) {
      setDeleteWorkoutPlanError(
        error instanceof Error
          ? error.message
          : "We could not delete your workout plan."
      );
    } finally {
      setIsDeletingWorkoutPlan(false);
    }
  };

  const handleDeleteAllAppData = async () => {
    if (!apiEnabled) {
      setDeleteAllAppDataError(
        "Delete all app data is only available when your account is synced."
      );
      return;
    }

    if (deleteAllAppDataConfirmationText !== "DELETE") {
      setDeleteAllAppDataError("Type DELETE to confirm this action.");
      return;
    }

    setIsDeletingAllAppData(true);
    setDeleteAllAppDataError(null);

    try {
      await deleteAllAppData();
      clearUserMessageVisibilityState();
      setDeleteAllAppDataConfirmOpen(false);
      await signOut();
      navigate("/", { replace: true });
    } catch (error) {
      setDeleteAllAppDataError(
        error instanceof Error
          ? error.message
          : "We could not delete your LiftLogic app data."
      );
    } finally {
      setIsDeletingAllAppData(false);
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
  const canResetProgramProgress = Boolean(
    apiEnabled && currentWorkoutPlan?.workoutReviewed
  );
  const canDeleteWorkoutPlan = Boolean(apiEnabled && currentWorkoutPlan);
  const canDeleteAllAppData = apiEnabled;

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
          <PlateLoadingSettingsSection
            draftSettings={draftSettings}
            onUpdateDraft={updateDraft}
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
          <ExerciseHistorySettingsSection
            draftSettings={draftSettings}
            onUpdateDraft={updateDraft}
          />
          <DataSettingsSection
            canDeleteAllAppData={canDeleteAllAppData}
            canDeleteWorkoutPlan={canDeleteWorkoutPlan}
            canResetProgramProgress={canResetProgramProgress}
            deleteAllAppDataError={deleteAllAppDataError}
            deleteWorkoutPlanError={deleteWorkoutPlanError}
            deleteWorkoutPlanMessage={deleteWorkoutPlanMessage}
            isDeletingAllAppData={isDeletingAllAppData}
            isDeletingWorkoutPlan={isDeletingWorkoutPlan}
            isResettingProgramProgress={isResettingProgramProgress}
            resetProgramProgressError={resetProgramProgressError}
            resetProgramProgressMessage={resetProgramProgressMessage}
            onDeleteAllAppData={() => {
              setDeleteAllAppDataError(null);
              setDeleteAllAppDataConfirmationText("");
              setDeleteAllAppDataConfirmOpen(true);
            }}
            onDeleteWorkoutPlan={() => {
              setDeleteWorkoutPlanError(null);
              setDeleteWorkoutPlanMessage(null);
              setDeleteWorkoutPlanConfirmOpen(true);
            }}
            onResetProgramProgress={() => {
              setResetProgramProgressError(null);
              setResetProgramProgressMessage(null);
              setResetProgramConfirmOpen(true);
            }}
          />
          <MessageSettingsSection
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
            loading={isSaving}
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
        <BottomSheet
          open={resetProgramConfirmOpen}
          variant="full"
          onClose={() => {
            if (!isResettingProgramProgress) {
              setResetProgramConfirmOpen(false);
            }
          }}
          eyebrow="Program Data"
          title="Reset current program progress?"
          description="Your completed workouts stay saved. LiftLogic will start this program from a fresh progress version and abandon any in-progress sessions."
          closeOnOverlayClick={!isResettingProgramProgress}
          actions={[
            {
              disabled: isResettingProgramProgress,
              label: "Cancel",
              tone: "white",
              variant: "outline",
            },
            {
              closeOnClick: false,
              icon: "refresh",
              label: isResettingProgramProgress ? "Resetting..." : "Reset progress",
              loading: isResettingProgramProgress,
              tone: "danger",
              variant: "outline",
              onClick: handleResetProgramProgress,
            },
          ]}
        >
          <div className={styles.resetSummary}>
            <p>
              Dashboard weekly progress will restart for the active program.
              Completed workout history, previous programs, exercise logs,
              notes, badges, and PR history are kept.
            </p>
            <p>
              Use this when you want to restart the same program without losing
              the training record you already built.
            </p>
          </div>
        </BottomSheet>
        <BottomSheet
          open={deleteWorkoutPlanConfirmOpen}
          variant="full"
          onClose={() => {
            if (!isDeletingWorkoutPlan) {
              setDeleteWorkoutPlanConfirmOpen(false);
            }
          }}
          eyebrow="Program Data"
          title="Delete current workout plan?"
          description="This removes the active program from your account and returns you to the welcome flow. Your completed workout history stays saved."
          closeOnOverlayClick={!isDeletingWorkoutPlan}
          actions={[
            {
              disabled: isDeletingWorkoutPlan,
              label: "Cancel",
              tone: "white",
              variant: "outline",
            },
            {
              closeOnClick: false,
              label: isDeletingWorkoutPlan ? "Deleting..." : "Delete plan",
              loading: isDeletingWorkoutPlan,
              tone: "danger",
              variant: "outline",
              onClick: handleDeleteWorkoutPlan,
            },
          ]}
        >
          <div className={styles.resetSummary}>
            <p>
              In-progress workouts from this plan will be abandoned so they no
              longer appear as active sessions.
            </p>
            <p>
              Completed sessions, exercise logs, notes, badges, and PR history
              are not deleted in this step.
            </p>
          </div>
        </BottomSheet>
        <BottomSheet
          open={deleteAllAppDataConfirmOpen}
          variant="full"
          onClose={() => {
            if (!isDeletingAllAppData) {
              setDeleteAllAppDataConfirmOpen(false);
            }
          }}
          eyebrow="Delete Data"
          title="Delete all LiftLogic app data?"
          description="This permanently removes your LiftLogic app records. Your Google account is not deleted."
          closeOnOverlayClick={!isDeletingAllAppData}
          actions={[
            {
              disabled: isDeletingAllAppData,
              label: "Cancel",
              tone: "white",
              variant: "outline",
            },
            {
              closeOnClick: false,
              disabled:
                isDeletingAllAppData ||
                deleteAllAppDataConfirmationText !== "DELETE",
              label: isDeletingAllAppData ? "Deleting..." : "Delete all data",
              loading: isDeletingAllAppData,
              tone: "danger",
              onClick: handleDeleteAllAppData,
            },
          ]}
        >
          <div className={styles.resetSummary}>
            <p>
              This deletes your LiftLogic profile, settings, current plan,
              workout sessions, exercise logs, workout notes, exercise notes,
              badges, and app-specific history.
            </p>
            <p>
              This does not delete your Firebase or Google sign-in account. If
              you sign in again later, LiftLogic will create a fresh profile.
            </p>
            <label className={styles.confirmationField}>
              <span>Type DELETE to confirm</span>
              <input
                autoComplete="off"
                disabled={isDeletingAllAppData}
                value={deleteAllAppDataConfirmationText}
                onChange={(event) =>
                  setDeleteAllAppDataConfirmationText(event.target.value)
                }
              />
            </label>
            {deleteAllAppDataError ? (
              <p className={styles.error}>{deleteAllAppDataError}</p>
            ) : null}
          </div>
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
