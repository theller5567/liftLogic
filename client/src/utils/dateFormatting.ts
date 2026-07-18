const monthDayFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
});

const shortMonthDayFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
});

export const formatMonthDay = (date: Date | string) =>
  monthDayFormatter.format(new Date(date));

export const formatShortMonthDay = (date: Date | string) =>
  shortMonthDayFormatter.format(new Date(date));
