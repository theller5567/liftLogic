import { Target } from "lucide-react";

import type { WorkoutPlanDto } from "../../services/api";
import ProgramIcon from "../../assets/icons/001-notes.svg?react";
import {
  WORKOUT_FOCUS_DURATION_WEEKS,
  type WorkoutFocusArea,
  type WorkoutFocusBlock,
} from "../../../../shared/types/workoutFocus.types";
import {
  getWorkoutFocusLabel,
  isWorkoutFocusBlockActive,
} from "../../../../shared/utils/workoutFocus";
import Button from "../Button";
import FormField, { SelectInput } from "../ui/FormField";
import SectionAccordion from "../ui/SectionAccordion";
import type { FocusAreaOption } from "./settingsSectionTypes";
import {
  buildOnboardingSnapshotRows,
  formatFocusDate,
  formatSettingLabel,
} from "./settingsSectionUtils";
import styles from "../../styles/pages/settings.module.scss";

type ProgramSettingsSectionProps = {
  activeFocusBlock: WorkoutFocusBlock | null | undefined;
  currentWorkoutPlan: WorkoutPlanDto | null;
  focusAreaOptions: FocusAreaOption[];
  focusError: string | null;
  focusMessage: string | null;
  isSavingFocus: boolean;
  onClearFocusBlock: () => void;
  onFocusAreaChange: (focusArea: WorkoutFocusArea) => void;
  onFocusDurationChange: (durationWeeks: WorkoutFocusBlock["durationWeeks"]) => void;
  onRedoOnboarding: () => void;
  onStartFocusBlock: () => void;
  selectedFocusArea: WorkoutFocusArea;
  selectedFocusDuration: WorkoutFocusBlock["durationWeeks"];
};

export const ProgramSettingsSection = ({
  activeFocusBlock,
  currentWorkoutPlan,
  focusAreaOptions,
  focusError,
  focusMessage,
  isSavingFocus,
  onClearFocusBlock,
  onFocusAreaChange,
  onFocusDurationChange,
  onRedoOnboarding,
  onStartFocusBlock,
  selectedFocusArea,
  selectedFocusDuration,
}: ProgramSettingsSectionProps) => {
  const isFocusActive = isWorkoutFocusBlockActive(activeFocusBlock);
  const initialAnswers =
    currentWorkoutPlan?.initialOnboardingAnswers ??
    currentWorkoutPlan?.onboardingAnswers;
  const currentAnswers = currentWorkoutPlan?.onboardingAnswers;

  return (
    <SectionAccordion icon={<ProgramIcon aria-hidden="true" />} title="Program">
      <div className={styles.summaryRow}>
        <span>Workout Plan</span>
        <strong>{currentWorkoutPlan?.suggestedPreview.label ?? "Not set"}</strong>
      </div>
      <div className={styles.summaryRow}>
        <span>Current goal</span>
        <strong>
          {formatSettingLabel(currentWorkoutPlan?.onboardingAnswers.goal)}
        </strong>
      </div>
      <div className={styles.summaryRow}>
        <span>Equipment</span>
        <strong>
          {formatSettingLabel(currentWorkoutPlan?.onboardingAnswers.equipmentAccess)}
        </strong>
      </div>
      {initialAnswers ? (
        <div className={styles.onboardingSnapshotPanel}>
          <div className={styles.focusHeader}>
            <span>Starting answers</span>
            <strong>
              {currentWorkoutPlan?.createdAt
                ? formatFocusDate(currentWorkoutPlan.createdAt)
                : "Saved"}
            </strong>
          </div>
          <div className={styles.snapshotRows}>
            {buildOnboardingSnapshotRows(initialAnswers).map((row) => (
              <div key={row.label} className={styles.snapshotRow}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            ))}
          </div>
          {currentAnswers && currentAnswers !== initialAnswers ? (
            <p className={styles.messageHelper}>
              Current answers can change when you redo onboarding. This section
              keeps the original starting point for reference.
            </p>
          ) : null}
        </div>
      ) : null}
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
          Priority muscle groups are trained at least 3 times per week, or every
          workout on shorter plans.
        </p>
        <div className={styles.focusControls}>
          <FormField label="Focus area">
            <SelectInput
              value={selectedFocusArea}
              onChange={(event) =>
                onFocusAreaChange(event.target.value as WorkoutFocusArea)
              }
            >
              {focusAreaOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Duration">
            <SelectInput
              value={selectedFocusDuration}
              onChange={(event) =>
                onFocusDurationChange(
                  Number(event.target.value) as WorkoutFocusBlock["durationWeeks"]
                )
              }
            >
              {WORKOUT_FOCUS_DURATION_WEEKS.map((duration) => (
                <option key={duration} value={duration}>
                  {duration} weeks
                </option>
              ))}
            </SelectInput>
          </FormField>
        </div>
        <div className={styles.focusActions}>
          <Button
            disabled={isSavingFocus}
            label={isFocusActive ? "Replace block" : "Start block"}
            size="medium"
            tone="primary"
            onClick={onStartFocusBlock}
          />
          <Button
            disabled={isSavingFocus || !isFocusActive}
            label="Clear"
            size="medium"
            tone="gray"
            variant="outline"
            onClick={onClearFocusBlock}
          />
        </div>
        {focusError ? <p className={styles.error}>{focusError}</p> : null}
        {focusMessage ? <p className={styles.success}>{focusMessage}</p> : null}
      </div>
      <Button
        label="Redo onboarding"
        size="large"
        tone="secondary"
        onClick={onRedoOnboarding}
      />
    </SectionAccordion>
  );
};
