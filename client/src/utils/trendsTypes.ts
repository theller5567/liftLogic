export type TrendsMetric = {
  label: string;
  value: string;
  detail: string;
};

export type WeeklyTrendPoint = {
  label: string;
  volume: number;
  workouts: number;
};

export type ExerciseTrend = {
  exerciseId: string;
  label: string;
  topWeight: number;
  unit: string;
  totalVolume: number;
  sessions: number;
  changeLabel: string;
};

export type InsightCard = {
  label: string;
  value: string;
  detail: string;
};

export type TrendsData = {
  isMock: boolean;
  metrics: TrendsMetric[];
  weeklyVolume: WeeklyTrendPoint[];
  exerciseTrends: ExerciseTrend[];
  insights: InsightCard[];
};
