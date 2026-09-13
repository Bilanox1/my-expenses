import { useCallback, useEffect, useState } from "react";

import type { Expense } from "../types/expense";
import {
  addExpense,
  deleteExpense,
  getExpensesByWeek,
  getWeeklyExpenses,
  updateExpense,
} from "../services/expenseService";

export function useExpenses(weekId: string | null) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!weekId) {
      setExpenses([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const nextExpenses = await getExpensesByWeek(weekId);
      setExpenses(nextExpenses);
    } catch {
      setError("Something went wrong while loading your expenses.");
    } finally {
      setLoading(false);
    }
  }, [weekId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveExpense = async (description: string, amount: number, date: Date) => {
    if (!weekId) {
      throw new Error("No active week selected");
    }

    const cleanedDescription = description.trim();

    if (!cleanedDescription) {
      throw new Error("Description is required.");
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Amount must be greater than zero.");
    }

    await addExpense(cleanedDescription, amount, date, weekId);
    await refresh();
  };

  const removeExpense = async (expenseId: number) => {
    await deleteExpense(expenseId);
    await refresh();
  };

  const editExpense = async (expenseId: number, updates: Partial<Omit<Expense, "id">>) => {
    await updateExpense(expenseId, updates);
    await refresh();
  };

  return {
    expenses,
    loading,
    error,
    refresh,
    saveExpense,
    removeExpense,
    editExpense,
    getWeeklyExpenses: () => getWeeklyExpenses(weekId ?? ""),
  };
}
