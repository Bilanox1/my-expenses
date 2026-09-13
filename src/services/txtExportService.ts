import type { Expense } from "../types/expense";
import type { Week } from "../types/week";
import { formatCurrency } from "../utils/moneyUtils";
import { formatDisplayDate } from "../utils/dateUtils";

export async function exportWeekAsTxt(week: Week, expenses: Expense[]): Promise<void> {
  const groupedByDate = new Map<string, Expense[]>();

  for (const expense of expenses) {
    const items = groupedByDate.get(expense.date) ?? [];
    items.push(expense);
    groupedByDate.set(expense.date, items);
  }

  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const remaining = week.budget - totalSpent;

  const lines: string[] = [
    "MY EXPENSES",
    "===========",
    "",
    "Week:",
    `${week.startDate} - ${week.endDate}`,
    "",
    "Budget:",
    `${week.budget} DH`,
    "",
    "Expenses:",
    "",
  ];

  const dates = Array.from(groupedByDate.keys()).sort();

  if (dates.length === 0) {
    lines.push("No expenses recorded for this week.");
  } else {
    for (const date of dates) {
      const dayExpenses = groupedByDate.get(date) ?? [];
      const dailyTotal = dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);

      lines.push(date, "----------");

      for (const expense of dayExpenses) {
        lines.push(`${expense.description.padEnd(15)} ${formatCurrency(expense.amount).replace(" DH", "")} DH`);
      }

      lines.push("", "Daily Total:", `${dailyTotal} DH`, "");
    }
  }

  lines.push("SUMMARY", "=======", "", `Weekly Budget: ${week.budget} DH`, `Total Spent: ${totalSpent} DH`, `Remaining: ${remaining} DH`);

  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `expenses-week-${week.id}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function buildWeekSummary(week: Week, expenses: Expense[]) {
  const groupedByDate = new Map<string, Expense[]>();

  for (const expense of expenses) {
    const items = groupedByDate.get(expense.date) ?? [];
    items.push(expense);
    groupedByDate.set(expense.date, items);
  }

  const dayEntries = Array.from(groupedByDate.keys()).sort().map((date) => ({
    date,
    label: formatDisplayDate(date),
    total: (groupedByDate.get(date) ?? []).reduce((sum, expense) => sum + expense.amount, 0),
  }));

  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return {
    week,
    totalSpent,
    remaining: week.budget - totalSpent,
    dayEntries,
  };
}
