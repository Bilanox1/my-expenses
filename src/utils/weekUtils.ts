import { formatDate } from "./dateUtils";

export function getWeekId(date: Date = new Date()): string {
  return formatDate(getWeekStart(date));
}

export function getWeekStart(date: Date = new Date()): Date {
  const result = new Date(date);
  const day = result.getDay();
  const daysSinceSaturday = (day + 1) % 7;

  result.setDate(result.getDate() - daysSinceSaturday);
  result.setHours(0, 0, 0, 0);

  return result;
}

export function getWeekEnd(date: Date = new Date()): Date {
  const start = getWeekStart(date);
  const end = new Date(start);

  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return end;
}

export function getWeekDates(weekStart: string): string[] {
  const start = new Date(`${weekStart}T12:00:00`);
  const dates: string[] = [];

  for (let index = 0; index < 7; index += 1) {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    dates.push(formatDate(current));
  }

  return dates;
}

export function getWeekLabel(startDate: string, endDate: string): string {
  return `${startDate} → ${endDate}`;
}