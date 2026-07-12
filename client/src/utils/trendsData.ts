import type {
  WorkoutExerciseLog,
  WorkoutSessionDto,
  WorkoutSetLog,
} from "../../../shared/types/workoutSession.types";
import { getStartOfWeek } from "./workoutSessionDates";
import { mockTrendsData } from "./trendsMockData";
import type {
  ExerciseTrend,
  InsightCard,
  TrendsData,
  TrendsMetric,
  WeeklyTrendPoint,
} from "./trendsTypes";

const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

const formatCompactNumber = (value: number, suffix = "") => {
  if (value >= 1000) {
    const compactValue = value / 1000;
    const rounded =
      compactValue >= 100
        ? Math.round(compactValue)
        : Number(compactValue.toFixed(1));

    return `${rounded}k${suffix}`;
  }

  return `${Math.round(value)}${suffix}`;
};

const formatDuration = (seconds: number) => {
  const minutes = Math.round(seconds / 60);

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  return `${minutes}m`;
};

const getSetVolume = (setLog: WorkoutSetLog) => {
  if (!setLog.completed || setLog.weight === undefined || setLog.actualReps === undefined) {
    return 0;
  }

  return setLog.weight * setLog.actualReps;
};

const getExerciseVolume = (exerciseLog: WorkoutExerciseLog) =>
  exerciseLog.sets.reduce((total, setLog) => total + getSetVolume(setLog), 0);

const getSessionVolume = (session: WorkoutSessionDto) =>
  session.exerciseLogs.reduce(
    (total, exerciseLog) => total + getExerciseVolume(exerciseLog),
    0
  );

const getCompletedSetCount = (session: WorkoutSessionDto) =>
  session.exerciseLogs.reduce(
    (total, exerciseLog) =>
      total + exerciseLog.sets.filter((setLog) => setLog.completed).length,
    0
  );

const getCompletedRepCount = (session: WorkoutSessionDto) =>
  session.exerciseLogs.reduce(
    (total, exerciseLog) =>
      total +
      exerciseLog.sets.reduce(
        (setTotal, setLog) =>
          setTotal + (setLog.completed ? setLog.actualReps ?? 0 : 0),
        0
      ),
    0
  );

const getWeekLabel = (date: Date) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    date
  );

const buildWeeklyPoints = (
  completedSessions: WorkoutSessionDto[],
  endDate: Date
): WeeklyTrendPoint[] => {
  const currentWeekStart = getStartOfWeek(endDate);
  const weekStarts = Array.from({ length: 8 }, (_, index) => {
    const weekStart = new Date(currentWeekStart.getTime() - (7 - index) * WEEK_IN_MS);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  });

  return weekStarts.map((weekStart) => {
    const weekEnd = new Date(weekStart.getTime() + WEEK_IN_MS);
    const sessionsForWeek = completedSessions.filter((session) => {
      const sessionDate = new Date(session.scheduledFor);
      return sessionDate >= weekStart && sessionDate < weekEnd;
    });

    return {
      label: getWeekLabel(weekStart),
      volume: sessionsForWeek.reduce(
        (total, session) => total + getSessionVolume(session),
        0
      ),
      workouts: sessionsForWeek.length,
    };
  });
};

const buildExerciseTrends = (
  completedSessions: WorkoutSessionDto[]
): ExerciseTrend[] => {
  const exerciseMap = new Map<
    string,
    {
      label: string;
      topWeight: number;
      unit: string;
      totalVolume: number;
      sessionIds: Set<string>;
      firstTopWeight?: number;
      latestTopWeight?: number;
      latestTime: number;
    }
  >();

  for (const session of completedSessions) {
    const sessionTime = new Date(session.scheduledFor).getTime();

    for (const exerciseLog of session.exerciseLogs) {
      const completedWeightedSets = exerciseLog.sets.filter(
        (setLog) => setLog.completed && setLog.weight !== undefined
      );

      if (completedWeightedSets.length === 0) {
        continue;
      }

      const topSet = completedWeightedSets.reduce((best, setLog) =>
        (setLog.weight ?? 0) > (best.weight ?? 0) ? setLog : best
      );
      const topWeight = topSet.weight ?? 0;
      const current = exerciseMap.get(exerciseLog.exerciseId);

      if (!current) {
        exerciseMap.set(exerciseLog.exerciseId, {
          label: exerciseLog.label,
          topWeight,
          unit:
            topSet.weightUnit ??
            exerciseLog.prescriptionSnapshot.weightUnit ??
            "",
          totalVolume: getExerciseVolume(exerciseLog),
          sessionIds: new Set([session._id]),
          firstTopWeight: topWeight,
          latestTopWeight: topWeight,
          latestTime: sessionTime,
        });
        continue;
      }

      current.topWeight = Math.max(current.topWeight, topWeight);
      current.totalVolume += getExerciseVolume(exerciseLog);
      current.sessionIds.add(session._id);

      if (sessionTime >= current.latestTime) {
        current.latestTopWeight = topWeight;
        current.latestTime = sessionTime;
      }
    }
  }

  return [...exerciseMap.entries()]
    .map(([exerciseId, trend]) => {
      const change =
        (trend.latestTopWeight ?? trend.topWeight) -
        (trend.firstTopWeight ?? trend.topWeight);

      return {
        exerciseId,
        label: trend.label,
        topWeight: trend.topWeight,
        unit: trend.unit,
        totalVolume: trend.totalVolume,
        sessions: trend.sessionIds.size,
        changeLabel:
          change === 0
            ? "Even"
            : `${change > 0 ? "+" : ""}${Number(change.toFixed(1))} ${trend.unit}`.trim(),
      };
    })
    .sort((left, right) => right.totalVolume - left.totalVolume)
    .slice(0, 5);
};

const buildMetrics = (
  completedSessions: WorkoutSessionDto[],
  allSessions: WorkoutSessionDto[]
): TrendsMetric[] => {
  const totalVolume = completedSessions.reduce(
    (total, session) => total + getSessionVolume(session),
    0
  );
  const totalSets = completedSessions.reduce(
    (total, session) => total + getCompletedSetCount(session),
    0
  );
  const totalReps = completedSessions.reduce(
    (total, session) => total + getCompletedRepCount(session),
    0
  );
  const completionRate =
    completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce(
            (total, session) => total + session.completionPercentage,
            0
          ) / completedSessions.length
        )
      : 0;
  const durationSessions = completedSessions.filter(
    (session) => session.durationSeconds !== undefined
  );
  const averageDuration =
    durationSessions.length > 0
      ? durationSessions.reduce(
          (total, session) => total + (session.durationSeconds ?? 0),
          0
        ) / durationSessions.length
      : 0;

  return [
    {
      label: "Workouts",
      value: String(completedSessions.length),
      detail: `${allSessions.length} sessions started`,
    },
    {
      label: "Completion",
      value: `${completionRate}%`,
      detail: "average workout completion",
    },
    {
      label: "Volume",
      value: formatCompactNumber(totalVolume, " lb"),
      detail: `${totalSets} sets • ${totalReps} reps`,
    },
    {
      label: "Avg Duration",
      value: averageDuration > 0 ? formatDuration(averageDuration) : "N/A",
      detail:
        averageDuration > 0
          ? "per completed workout"
          : "complete workouts to track time",
    },
  ];
};

const buildInsights = (
  weeklyVolume: WeeklyTrendPoint[],
  exerciseTrends: ExerciseTrend[],
  completedSessions: WorkoutSessionDto[]
): InsightCard[] => {
  const bestWeek = weeklyVolume.reduce((best, point) =>
    point.volume > best.volume ? point : best
  );
  const mostTrainedExercise = exerciseTrends[0];
  const badgeCounts = completedSessions.flatMap((session) => session.badgeIds);
  const attentionBadge = badgeCounts.find((badgeId) =>
    ["missed_reps", "pain", "felt_hard"].includes(badgeId)
  );

  return [
    {
      label: "Best week",
      value: bestWeek.volume > 0 ? formatCompactNumber(bestWeek.volume, " lb") : "N/A",
      detail:
        bestWeek.volume > 0
          ? `${bestWeek.label} had your highest volume.`
          : "Complete workouts to set a benchmark.",
    },
    {
      label: "Most trained",
      value: mostTrainedExercise?.label ?? "N/A",
      detail: mostTrainedExercise
        ? `${mostTrainedExercise.sessions} sessions logged.`
        : "Exercise trends appear after completed sets.",
    },
    {
      label: "Needs attention",
      value: attentionBadge
        ? attentionBadge.replace("_", " ")
        : "Stay consistent",
      detail: attentionBadge
        ? "Recent workout notes flagged this area."
        : "No negative flags in this trend window.",
    },
  ];
};

export const buildTrendsData = (
  sessions: WorkoutSessionDto[],
  endDate = new Date()
): TrendsData => {
  const completedSessions = sessions.filter(
    (session) => session.status === "completed"
  );

  if (completedSessions.length === 0) {
    return mockTrendsData;
  }

  const weeklyVolume = buildWeeklyPoints(completedSessions, endDate);
  const exerciseTrends = buildExerciseTrends(completedSessions);

  return {
    isMock: false,
    metrics: buildMetrics(completedSessions, sessions),
    weeklyVolume,
    exerciseTrends,
    insights: buildInsights(weeklyVolume, exerciseTrends, completedSessions),
  };
};

export const formatTrendVolume = (volume: number) =>
  formatCompactNumber(volume, " lb");
