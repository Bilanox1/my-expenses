import { useMemo } from "react";

import type { Expense } from "../types/expense";
import { calculateRemaining, calculateTotalSpent, getBudgetStatusText } from "../utils/moneyUtils";

export function useBalance(budget: number, expenses: Expense[]) {
  return useMemo(() => {
    const totalSpent = calculateTotalSpent(expenses);
    const remaining = calculateRemaining(budget, totalSpent);

    return {
      totalSpent,
      remaining,
      statusText: getBudgetStatusText(remaining),
      percentageSpent: budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0,
    };
  }, [budget, expenses]);
}
