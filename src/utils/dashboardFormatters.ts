export const formatWorkDaysFromHours = (hours: number, wrapInParentheses = true) => {
  const totalHours = Math.max(0, Number(hours) || 0);
  let days = Math.floor(totalHours / 8);
  let remainingHours = Math.round(totalHours - (days * 8));

  if (remainingHours >= 8) {
    days += 1;
    remainingHours = 0;
  }

  const formatted = [
    days > 0 ? `${days}d` : '',
    remainingHours > 0 ? `${remainingHours}h` : '',
  ].filter(Boolean).join(' ') || '0h';

  return wrapInParentheses ? `(${formatted})` : formatted;
};
