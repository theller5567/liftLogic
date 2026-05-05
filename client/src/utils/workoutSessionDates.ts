import type { WorkoutSessionDto } from "../../../shared/types/workoutSession.types";

export const getStartOfWeek = (date: Date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

export const getEndOfWeek = (date: Date) => {
  const end = getStartOfWeek(date);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

export const getDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const isSameDate = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

export const getSessionDate = (session: WorkoutSessionDto) =>
  new Date(session.scheduledFor);

export const findWorkoutSessionForDate = (
  workoutSessions: WorkoutSessionDto[],
  date: Date,
  programDayId?: string,
  status?: WorkoutSessionDto["status"]
) =>
  workoutSessions
    .filter(
      (session) =>
        (!programDayId || session.programDayId === programDayId) &&
        (!status || session.status === status) &&
        isSameDate(getSessionDate(session), date)
    )
    .sort(
      (left, right) =>
        new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime()
    )[0] ?? null;
