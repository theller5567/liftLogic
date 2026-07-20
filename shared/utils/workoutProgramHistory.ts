import type {
  ProgramSwitchReason,
  WorkoutProgramHistoryEntry,
} from "../types/workoutPlan.types";

export type ProgramHistoryPreview = {
  label: string;
  programId: string;
};

type CreateProgramHistoryEntryInput = {
  now: Date;
  preview: ProgramHistoryPreview;
  programVersion: number;
  switchReason: ProgramSwitchReason;
  workoutPlanId: string;
};

type ResolveProgramHistoryInput = {
  activeProgramHistoryId?: string;
  history?: WorkoutProgramHistoryEntry[] | null;
  now: Date;
  preview: ProgramHistoryPreview;
  programVersion?: number;
  switchReason: ProgramSwitchReason;
  workoutPlanId: string;
};

type ResetProgramHistoryInput = {
  activeProgramHistoryId?: string;
  history?: WorkoutProgramHistoryEntry[] | null;
  now: Date;
  preview: ProgramHistoryPreview;
  programVersion?: number;
  workoutPlanId: string;
};

export const createProgramHistoryEntry = ({
  now,
  preview,
  programVersion,
  switchReason,
  workoutPlanId,
}: CreateProgramHistoryEntryInput): WorkoutProgramHistoryEntry => ({
  id: `program-history-${programVersion}`,
  workoutPlanId,
  programId: preview.programId,
  programLabel: preview.label,
  programVersion,
  startedAt: now.toISOString(),
  endedAt: null,
  status: "active",
  switchReason,
});

export const getActiveProgramHistoryEntry = (
  history: WorkoutProgramHistoryEntry[] | null | undefined,
  activeProgramHistoryId?: string
) =>
  history?.find(
    (entry) =>
      entry.status === "active" &&
      (!activeProgramHistoryId || entry.id === activeProgramHistoryId)
  ) ?? null;

export const resolveProgramHistoryForPreview = ({
  activeProgramHistoryId,
  history,
  now,
  preview,
  programVersion,
  switchReason,
  workoutPlanId,
}: ResolveProgramHistoryInput) => {
  const existingHistory = history ?? [];
  const activeEntry = getActiveProgramHistoryEntry(
    existingHistory,
    activeProgramHistoryId
  );

  if (activeEntry?.programId === preview.programId) {
    return {
      activeProgramHistoryId: activeEntry.id,
      programHistory: existingHistory,
      programVersion: activeEntry.programVersion,
    };
  }

  const nextProgramVersion =
    programVersion ??
    Math.max(0, ...existingHistory.map((entry) => entry.programVersion)) + 1;
  const archivedHistory = existingHistory.map((entry) =>
    entry.status === "active"
      ? {
          ...entry,
          endedAt: now.toISOString(),
          status: "archived" as const,
        }
      : entry
  );
  const nextActiveEntry = createProgramHistoryEntry({
    now,
    preview,
    programVersion: nextProgramVersion,
    switchReason,
    workoutPlanId,
  });

  return {
    activeProgramHistoryId: nextActiveEntry.id,
    programHistory: [...archivedHistory, nextActiveEntry],
    programVersion: nextProgramVersion,
  };
};

export const resetProgramHistoryForPreview = ({
  activeProgramHistoryId,
  history,
  now,
  preview,
  programVersion,
  workoutPlanId,
}: ResetProgramHistoryInput) => {
  const existingHistory = history ?? [];
  const activeEntry = getActiveProgramHistoryEntry(
    existingHistory,
    activeProgramHistoryId
  );
  const nextProgramVersion =
    Math.max(
      programVersion ?? 0,
      ...existingHistory.map((entry) => entry.programVersion),
      0
    ) + 1;
  const resetTimestamp = now.toISOString();
  const archivedHistory = existingHistory.map((entry) =>
    entry.status === "active" &&
    (!activeEntry || entry.id === activeEntry.id)
      ? {
          ...entry,
          endedAt: resetTimestamp,
          status: "archived" as const,
        }
      : entry
  );
  const nextActiveEntry = createProgramHistoryEntry({
    now,
    preview,
    programVersion: nextProgramVersion,
    switchReason: "reset",
    workoutPlanId,
  });

  return {
    activeProgramHistoryId: nextActiveEntry.id,
    programHistory: [...archivedHistory, nextActiveEntry],
    programVersion: nextProgramVersion,
  };
};
