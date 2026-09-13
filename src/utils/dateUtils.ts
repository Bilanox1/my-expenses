export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(dateValue: string | Date): string {
  const date = typeof dateValue === "string" ? new Date(`${dateValue}T12:00:00`) : dateValue;

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export function formatDisplayShortDate(dateValue: string | Date): string {
  const date = typeof dateValue === "string" ? new Date(`${dateValue}T12:00:00`) : dateValue;

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function getDateFromISO(dateValue: string): Date {
  return new Date(`${dateValue}T12:00:00`);
}