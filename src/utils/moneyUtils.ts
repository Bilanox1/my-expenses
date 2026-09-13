export const DEFAULT_WEEKLY_BUDGET = 210;

export function formatCurrency(value: number, currency = "DH"): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  const roundedValue = Math.round(safeValue);

  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(roundedValue)} ${currency}`;
}

export function calculateTotalSpent(expenses: { amount: number }[]): number {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

export function calculateRemaining(budget: number, spent: number): number {
  return budget - spent;
}

export function getBudgetStateText(remaining: number): string {
  if (remaining > 30) {
    return `You still have ${formatCurrency(remaining)}`;
  }

  if (remaining > 0) {
    return `Only ${formatCurrency(remaining)} remaining`;
  }

  if (remaining === 0) {
    return "Budget reached";
  }

  return `${formatCurrency(Math.abs(remaining))} over budget`;
}

export function getProgressPercentage(spent: number, budget: number): number {
  if (budget <= 0) {
    return 0;
  }

  return Math.min((spent / budget) * 100, 100);
}

export function getBudgetStatusText(remaining: number): string {
  if (remaining === 0) {
    return "Budget reached";
  }

  if (remaining < 0) {
    return `${formatCurrency(Math.abs(remaining))} over budget`;
  }

  if (remaining <= 30) {
    return `Only ${formatCurrency(remaining)} remaining`;
  }

  return `You still have ${formatCurrency(remaining)}`;
}

export function getSpentText(totalSpent: number, budget: number): string {
  if (totalSpent === budget) {
    return "Budget reached";
  }

  if (totalSpent > budget) {
    return `${formatCurrency(totalSpent - budget)} over budget`;
  }

  return `${formatCurrency(totalSpent)} spent`;
}