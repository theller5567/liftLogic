import DataIcon from "../../assets/icons/database.svg?react";
import Button from "../Button";
import SectionAccordion from "../ui/SectionAccordion";
import styles from "../../styles/pages/settings.module.scss";

type DataSettingsSectionProps = {
  canDeleteAllAppData: boolean;
  canDeleteWorkoutPlan: boolean;
  canResetProgramProgress: boolean;
  isDeletingAllAppData: boolean;
  isDeletingWorkoutPlan: boolean;
  isResettingProgramProgress: boolean;
  deleteAllAppDataError: string | null;
  deleteWorkoutPlanError: string | null;
  deleteWorkoutPlanMessage: string | null;
  resetProgramProgressError: string | null;
  resetProgramProgressMessage: string | null;
  onDeleteAllAppData: () => void;
  onDeleteWorkoutPlan: () => void;
  onResetProgramProgress: () => void;
};

export const DataSettingsSection = ({
  canDeleteAllAppData,
  canDeleteWorkoutPlan,
  canResetProgramProgress,
  isDeletingAllAppData,
  isDeletingWorkoutPlan,
  isResettingProgramProgress,
  deleteAllAppDataError,
  deleteWorkoutPlanError,
  deleteWorkoutPlanMessage,
  resetProgramProgressError,
  resetProgramProgressMessage,
  onDeleteAllAppData,
  onDeleteWorkoutPlan,
  onResetProgramProgress,
}: DataSettingsSectionProps) => (
  <SectionAccordion icon={<DataIcon />} title="Data">
    <div className={styles.dataActionPanel}>
      <div>
        <strong>Reset current program progress</strong>
        <p>
          Starts this program from a fresh progress version. Completed workout
          history stays saved, while in-progress sessions are abandoned.
        </p>
      </div>
      <Button
        disabled={!canResetProgramProgress || isResettingProgramProgress}
        icon="refresh"
        label={isResettingProgramProgress ? "Resetting..." : "Reset progress"}
        loading={isResettingProgramProgress}
        size="medium"
        tone="danger"
        variant="outline"
        onClick={onResetProgramProgress}
      />
    </div>
    {!canResetProgramProgress ? (
      <p className={styles.messageHelper}>
        Finish choosing and reviewing a program before resetting active progress.
      </p>
    ) : null}
    {resetProgramProgressError ? (
      <p className={styles.error}>{resetProgramProgressError}</p>
    ) : null}
    {resetProgramProgressMessage ? (
      <p className={styles.success}>{resetProgramProgressMessage}</p>
    ) : null}
    <div className={styles.dataActionPanel}>
      <div>
        <strong>Delete current workout plan</strong>
        <p>
          Removes the active plan and sends you back to the welcome flow.
          Completed workouts stay saved as historical training logs.
        </p>
      </div>
      <Button
        disabled={!canDeleteWorkoutPlan || isDeletingWorkoutPlan}
        label={isDeletingWorkoutPlan ? "Deleting..." : "Delete plan"}
        loading={isDeletingWorkoutPlan}
        size="medium"
        tone="danger"
        variant="outline"
        onClick={onDeleteWorkoutPlan}
      />
    </div>
    {!canDeleteWorkoutPlan ? (
      <p className={styles.messageHelper}>
        There is no active workout plan to delete right now.
      </p>
    ) : null}
    {deleteWorkoutPlanError ? (
      <p className={styles.error}>{deleteWorkoutPlanError}</p>
    ) : null}
    {deleteWorkoutPlanMessage ? (
      <p className={styles.success}>{deleteWorkoutPlanMessage}</p>
    ) : null}
    <div className={`${styles.dataActionPanel} ${styles.dataActionPanelCritical}`}>
      <div>
        <strong>Delete all LiftLogic app data</strong>
        <p>
          Permanently removes your LiftLogic profile, settings, workout plan,
          workout sessions, notes, badges, and app-specific history. This does
          not delete your Google account.
        </p>
      </div>
      <Button
        disabled={!canDeleteAllAppData || isDeletingAllAppData}
        label={isDeletingAllAppData ? "Deleting..." : "Delete all app data"}
        loading={isDeletingAllAppData}
        size="medium"
        tone="danger"
        onClick={onDeleteAllAppData}
      />
    </div>
    {!canDeleteAllAppData ? (
      <p className={styles.messageHelper}>
        Delete all app data is only available when your account is synced.
      </p>
    ) : null}
    {deleteAllAppDataError ? (
      <p className={styles.error}>{deleteAllAppDataError}</p>
    ) : null}
  </SectionAccordion>
);
