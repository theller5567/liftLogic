import { useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, Clock3, Dumbbell } from "lucide-react";

import AppShell from "../components/app/AppShell";
import { getWorkoutSessions } from "../services/api";
import type { WorkoutSessionDto } from "../../../shared/types/workoutSession.types";
import { buildTrendsData, formatTrendVolume } from "../utils/trendsData";
import type { TrendsMetric } from "../utils/trendsTypes";
import styles from "../styles/pages/trends.module.scss";

const metricIcons = [Activity, BarChart3, Dumbbell, Clock3];

const getTrendWindowStart = (date: Date) => {
  const start = new Date(date);
  start.setDate(start.getDate() - 8 * 7);
  start.setHours(0, 0, 0, 0);
  return start;
};

const getTrendWindowEnd = (date: Date) => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
};

const MetricCard = ({
  metric,
  metricIndex,
}: {
  metric: TrendsMetric;
  metricIndex: number;
}) => {
  const Icon = metricIcons[metricIndex] ?? Activity;

  return (
    <article className={styles.metricCard}>
      <Icon aria-hidden="true" />
      <div>
        <p>{metric.label}</p>
        <strong>{metric.value}</strong>
        <span>{metric.detail}</span>
      </div>
    </article>
  );
};

const Trends = () => {
  const [sessions, setSessions] = useState<WorkoutSessionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const trendWindowEnd = useMemo(() => getTrendWindowEnd(new Date()), []);
  const trendWindowStart = useMemo(
    () => getTrendWindowStart(trendWindowEnd),
    [trendWindowEnd]
  );
  const trendsData = useMemo(
    () => buildTrendsData(sessions, trendWindowEnd),
    [sessions, trendWindowEnd]
  );
  const maxWeeklyVolume = Math.max(
    ...trendsData.weeklyVolume.map((point) => point.volume),
    1
  );
  const maxWeeklyWorkouts = Math.max(
    ...trendsData.weeklyVolume.map((point) => point.workouts),
    1
  );

  useEffect(() => {
    let isMounted = true;

    const loadTrendSessions = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const { workoutSessions } = await getWorkoutSessions({
          dateFrom: trendWindowStart.toISOString(),
          dateTo: trendWindowEnd.toISOString(),
        });

        if (isMounted) {
          setSessions(workoutSessions);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "We could not load your trends yet."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadTrendSessions();

    return () => {
      isMounted = false;
    };
  }, [trendWindowEnd, trendWindowStart]);

  return (
    <AppShell>
      <section className={styles.trendsPage}>
        <header className={styles.header}>
          <div>
            <p>Trends</p>
            <h1>Progress at a glance</h1>
            <span>
              Track consistency, weekly volume, and the lifts that are moving.
            </span>
          </div>
          <strong className={styles.dataMode}>
            {trendsData.isMock ? "Example data" : "Live data"}
          </strong>
        </header>

        {loadError ? <p className={styles.error}>{loadError}</p> : null}
        {isLoading ? <p className={styles.loading}>Loading trends...</p> : null}

        {trendsData.isMock ? (
          <article className={styles.previewNotice}>
            <strong>Preview mode</strong>
            <p>
              Complete a few workouts to replace this sample with your real
              training trends.
            </p>
          </article>
        ) : null}

        <div className={styles.metricGrid}>
          {trendsData.metrics.map((metric, metricIndex) => (
            <MetricCard
              key={metric.label}
              metric={metric}
              metricIndex={metricIndex}
            />
          ))}
        </div>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p>Weekly Volume</p>
              <h2>Training load</h2>
            </div>
            <span>8 weeks</span>
          </div>
          <div className={styles.volumeChart} aria-label="Weekly training volume">
            {trendsData.weeklyVolume.map((point) => (
              <div key={point.label} className={styles.volumeBarGroup}>
                <div className={styles.volumeTrack}>
                  <span
                    style={{
                      height: `${Math.max(
                        8,
                        (point.volume / maxWeeklyVolume) * 100
                      )}%`,
                    }}
                  />
                </div>
                <strong>{formatTrendVolume(point.volume)}</strong>
                <small>{point.label}</small>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p>Consistency</p>
              <h2>Completed workouts</h2>
            </div>
          </div>
          <div className={styles.consistencyGrid}>
            {trendsData.weeklyVolume.map((point) => (
              <div key={point.label} className={styles.consistencyPoint}>
                <span>{point.label}</span>
                <strong>{point.workouts}</strong>
                <i
                  style={{
                    opacity: Math.max(
                      0.22,
                      point.workouts / maxWeeklyWorkouts
                    ),
                  }}
                />
              </div>
            ))}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p>Strength</p>
              <h2>Exercise progress</h2>
            </div>
          </div>
          <div className={styles.exerciseList}>
            {trendsData.exerciseTrends.map((exercise) => (
              <article key={exercise.exerciseId} className={styles.exerciseTrend}>
                <div>
                  <h3>{exercise.label}</h3>
                  <span>{exercise.sessions} sessions</span>
                </div>
                <div>
                  <strong>
                    {exercise.topWeight} {exercise.unit}
                  </strong>
                  <span>{exercise.changeLabel}</span>
                </div>
                <small>{formatTrendVolume(exercise.totalVolume)} total volume</small>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.insightGrid}>
          {trendsData.insights.map((insight) => (
            <article key={insight.label} className={styles.insightCard}>
              <p>{insight.label}</p>
              <strong>{insight.value}</strong>
              <span>{insight.detail}</span>
            </article>
          ))}
        </section>
      </section>
    </AppShell>
  );
};

export default Trends;
