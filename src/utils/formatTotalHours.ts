const totalHoursFormatter = new Intl.NumberFormat("es-PA", {
  maximumFractionDigits: 2,
});

function formatHoursValue(hours: number): string {
  if (hours >= 1_000_000) {
    return `${totalHoursFormatter.format(hours / 1_000_000)}M`;
  }

  if (hours >= 1_000) {
    return `${totalHoursFormatter.format(hours / 1_000)}K`;
  }

  return totalHoursFormatter.format(hours);
}

export function formatTotalHours(
  seconds: number | null,
  fallback = "—",
): string {
  if (seconds === null) return fallback;

  return `${formatHoursValue(seconds / 3600)} hrs`;
}
