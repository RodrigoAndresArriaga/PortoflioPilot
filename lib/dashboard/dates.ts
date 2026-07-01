// next calendar occurrence of investment day
export function computeNextInvestmentDate(
  investmentDay: number,
  referenceDate: Date = new Date(),
): Date {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  function clampDay(yearValue: number, monthValue: number, day: number): number {
    const lastDay = new Date(yearValue, monthValue + 1, 0).getDate();
    return Math.min(day, lastDay);
  }

  const thisMonthDay = clampDay(year, month, investmentDay);
  const thisMonthDate = new Date(year, month, thisMonthDay);

  if (referenceDate <= thisMonthDate) {
    return thisMonthDate;
  }

  const nextMonth = month + 1;
  const nextYear = nextMonth > 11 ? year + 1 : year;
  const normalizedMonth = nextMonth > 11 ? 0 : nextMonth;
  const nextMonthDay = clampDay(nextYear, normalizedMonth, investmentDay);

  return new Date(nextYear, normalizedMonth, nextMonthDay);
}

export function formatInvestmentDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
