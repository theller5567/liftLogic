import type { UserSettings } from "../../../../shared/types/userSettings.types";
import type { WorkoutFocusArea } from "../../../../shared/types/workoutFocus.types";

export type SettingsUpdate = (
  updater: (current: UserSettings) => UserSettings
) => void;

export type FocusAreaOption = {
  label: string;
  value: WorkoutFocusArea;
};
