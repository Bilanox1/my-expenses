import { db } from "../db/database";
import type { Expense } from "../types/expense";
import { formatDate } from "../utils/dateUtils";

export async function addExpense(
  description: string,
  amount: number,
  date: Date,
  weekId: string
): Promise<number> {
  const expense: Expense = {
    description: description.trim(),
    amount: Number(amount),
    date: formatDate(date),
    weekId,
    createdAt: new Date().toISOString(),
  };

  return db.expenses.add(expense);
}

export async function getExpensesByWeek(weekId: string): Promise<Expense[]> {
  return db.expenses.where("weekId").equals(weekId).sortBy("date");
}

export async function getExpensesByDate(date: string, weekId: string): Promise<Expense[]> {
  return db.expenses.where("date").equals(date).and((expense) => expense.weekId === weekId).sortBy("createdAt");
}

export async function deleteExpense(expenseId: number): Promise<void> {
  await db.expenses.delete(expenseId);
}

export async function getWeeklyExpenses(weekId: string): Promise<Expense[]> {
  return getExpensesByWeek(weekId);
}

export async function updateExpense(
  id: number,
  updates: Partial<Omit<Expense, "id">>
): Promise<void> {
  await db.expenses.update(id, updates);
}