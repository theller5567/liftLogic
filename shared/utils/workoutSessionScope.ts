type SoftDeletableSession = {
  deletedAt?: Date | string | null;
};

type ProgramScopedSession = SoftDeletableSession & {
  programHistoryId?: string | null;
  programId?: string | null;
  programVersion?: number | null;
  workoutPlanId?: string | null;
};

type ExerciseHistoryScopedSession = ProgramScopedSession & {
  scheduledFor: Date | string;
};

export type CurrentProgramScope = {
  activeProgramHistoryId?: string | null;
  programId?: string | null;
  programVersion?: number | null;
  workoutPlanId?: string | null;
};

export const isDeletedWorkoutSession = (session: SoftDeletableSession) =>
  Boolean(session.deletedAt);

export const filterActiveWorkoutSessions = <TSession extends SoftDeletableSession>(
  sessions: TSession[]
) => sessions.filter((session) => !isDeletedWorkoutSession(session));

const hasScopeValue = (scope: CurrentProgramScope) =>
  Boolean(
    scope.activeProgramHistoryId ||
      scope.programId ||
      scope.programVersion ||
      scope.workoutPlanId
  );

export const isWorkoutSessionInCurrentProgram = <
  TSession extends ProgramScopedSession,
>(
  session: TSession,
  scope: CurrentProgramScope
) => {
  if (isDeletedWorkoutSession(session) || !hasScopeValue(scope)) {
    return false;
  }

  if (scope.activeProgramHistoryId && session.programHistoryId) {
    return session.programHistoryId === scope.activeProgramHistoryId;
  }

  if (
    scope.programVersion &&
    session.programVersion &&
    scope.programVersion !== session.programVersion
  ) {
    return false;
  }

  if (
    scope.workoutPlanId &&
    session.workoutPlanId &&
    scope.workoutPlanId !== session.workoutPlanId
  ) {
    return false;
  }

  if (scope.programId && session.programId) {
    return scope.programId === session.programId;
  }

  return Boolean(
    (scope.workoutPlanId && session.workoutPlanId) ||
      (scope.programVersion && session.programVersion) ||
      (scope.activeProgramHistoryId && session.programHistoryId)
  );
};

export const filterCurrentProgramWorkoutSessions = <
  TSession extends ProgramScopedSession,
>(
  sessions: TSession[],
  scope: CurrentProgramScope
) =>
  filterActiveWorkoutSessions(sessions).filter((session) =>
    isWorkoutSessionInCurrentProgram(session, scope)
  );

export type ExerciseHistoryScopeOptions = {
  currentProgramScope?: CurrentProgramScope;
  exerciseId?: string | null;
  includePreviousPrograms?: boolean;
  resetCutoffs?: Record<string, string>;
};

const isAfterExerciseResetCutoff = (
  session: ExerciseHistoryScopedSession,
  exerciseId: string | null | undefined,
  resetCutoffs: Record<string, string> | undefined
) => {
  if (!exerciseId || !resetCutoffs?.[exerciseId]) {
    return true;
  }

  return (
    new Date(session.scheduledFor).getTime() >
    new Date(resetCutoffs[exerciseId]).getTime()
  );
};

export const filterExerciseHistoryWorkoutSessions = <
  TSession extends ExerciseHistoryScopedSession,
>(
  sessions: TSession[],
  options: ExerciseHistoryScopeOptions = {}
) => {
  const activeSessions = filterActiveWorkoutSessions(sessions).filter((session) =>
    isAfterExerciseResetCutoff(
      session,
      options.exerciseId,
      options.resetCutoffs
    )
  );

  if (options.includePreviousPrograms === false && options.currentProgramScope) {
    return filterCurrentProgramWorkoutSessions(
      activeSessions,
      options.currentProgramScope
    );
  }

  return activeSessions;
};
