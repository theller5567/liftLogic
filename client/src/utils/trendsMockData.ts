import type { TrendsData } from "./trendsTypes";

export const mockTrendsData: TrendsData = {
  isMock: true,
  metrics: [
    {
      label: "Workouts",
      value: "22",
      detail: "completed in the last 8 weeks",
    },
    {
      label: "Completion",
      value: "86%",
      detail: "planned exercises finished",
    },
    {
      label: "Volume",
      value: "148k lb",
      detail: "tracked training load",
    },
    {
      label: "Avg Duration",
      value: "54m",
      detail: "per completed workout",
    },
  ],
  weeklyVolume: [
    { label: "W1", volume: 13200, workouts: 2 },
    { label: "W2", volume: 15850, workouts: 3 },
    { label: "W3", volume: 17100, workouts: 3 },
    { label: "W4", volume: 16400, workouts: 3 },
    { label: "W5", volume: 18850, workouts: 3 },
    { label: "W6", volume: 20350, workouts: 3 },
    { label: "W7", volume: 21700, workouts: 3 },
    { label: "W8", volume: 24600, workouts: 2 },
  ],
  exerciseTrends: [
    {
      exerciseId: "back_squat",
      label: "Back Squat",
      topWeight: 185,
      unit: "lb",
      totalVolume: 31200,
      sessions: 6,
      changeLabel: "+20 lb",
    },
    {
      exerciseId: "bench_press",
      label: "Bench Press",
      topWeight: 145,
      unit: "lb",
      totalVolume: 26400,
      sessions: 7,
      changeLabel: "+10 lb",
    },
    {
      exerciseId: "dumbbell_row",
      label: "Dumbbell Row",
      topWeight: 65,
      unit: "lb",
      totalVolume: 18480,
      sessions: 7,
      changeLabel: "+7.5 lb",
    },
    {
      exerciseId: "overhead_press",
      label: "Overhead Press",
      topWeight: 95,
      unit: "lb",
      totalVolume: 12600,
      sessions: 5,
      changeLabel: "+5 lb",
    },
  ],
  insights: [
    {
      label: "Best week",
      value: "24.6k lb",
      detail: "Your highest weekly training volume.",
    },
    {
      label: "Most trained",
      value: "Bench Press",
      detail: "Logged in 7 example sessions.",
    },
    {
      label: "Needs attention",
      value: "Rest consistency",
      detail: "Real trends will flag missed reps, pain, or long gaps.",
    },
  ],
};
