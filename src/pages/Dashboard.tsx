import { useMemo, useState } from "react";

import { useCurrentWeek } from "../hooks/useCurrentWeek";
import { useExpenses } from "../hooks/useExpenses";
import { useBalance } from "../hooks/useBalance";
import { exportWeekAsTxt } from "../services/txtExportService";
import { formatDisplayDate, formatDisplayShortDate } from "../utils/dateUtils";
import { formatCurrency } from "../utils/moneyUtils";
import { getWeekDates } from "../utils/weekUtils";

export function Dashboard() {
  const { week, loading: weekLoading } = useCurrentWeek();
  const { expenses, saveExpense, removeExpense } = useExpenses(week?.id ?? null);
  const balance = useBalance(week?.budget ?? 0, expenses);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const weeklyDays = useMemo(() => {
    if (!week) {
      return [] as { date: string; total: number; items: typeof expenses }[];
    }

    return getWeekDates(week.startDate).map((date) => ({
      date,
      total: expenses
        .filter((expense) => expense.date === date)
        .reduce((sum, expense) => sum + expense.amount, 0),
      items: expenses.filter((expense) => expense.date === date),
    }));
  }, [week, expenses]);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!week) {
      setStatus("The current week is not ready yet.");
      return;
    }

    try {
      await saveExpense(description, Number(amount), new Date());
      setDescription("");
      setAmount("");
      setStatus("Expense added successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong while saving the expense.";
      setStatus(message);
    }
  };

  const handleDelete = async (expenseId: number) => {
    const confirmed = window.confirm("Delete this expense?");

    if (!confirmed || !expenseId) {
      return;
    }

    await removeExpense(expenseId);
    setStatus("Expense deleted.");
  };

  if (weekLoading || !week) {
    return <main className="app-shell"><div className="page-panel"><p>Loading your weekly budget…</p></div></main>;
  }

  return (
    <main className="app-shell">
      <div className="page-panel">
        <header className="page-header">
          <div>
            <p className="eyebrow">My Expenses</p>
            <h1>{formatDisplayShortDate(week.startDate)} → {formatDisplayShortDate(week.endDate)}</h1>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void exportWeekAsTxt(week, expenses)}
          >
            Export TXT
          </button>
        </header>

        <section className="summary-card accent-card">
          <p className="muted-label">Remaining</p>
          <h2>{formatCurrency(balance.remaining)}</h2>
          <p className="status-text">{balance.statusText}</p>
        </section>

        <div className="budget-grid">
          <article className="summary-card">
            <p className="muted-label">Weekly budget</p>
            <p className="big-number">{formatCurrency(week.budget)}</p>
          </article>
          <article className="summary-card">
            <p className="muted-label">Spent</p>
            <p className="big-number">{formatCurrency(balance.totalSpent)}</p>
          </article>
        </div>

        <div className="progress-block">
          <div className="progress-meta">
            <span>Spent {formatCurrency(balance.totalSpent)} / {formatCurrency(week.budget)}</span>
            <span>{Math.round(balance.percentageSpent)}%</span>
          </div>
          <div className="progress-track" aria-label="Weekly spending progress">
            <div className="progress-bar" style={{ width: `${balance.percentageSpent}%` }} />
          </div>
        </div>

        <form className="expense-form" onSubmit={handleSubmit}>
          <label>
            What did you spend on?
            <input
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Tomatoes"
              aria-label="Expense description"
            />
          </label>

          <label>
            Amount
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="5"
              aria-label="Expense amount"
            />
          </label>

          <button type="submit" className="primary-button">+ Add expense</button>
        </form>

        {status ? <p className="status-message">{status}</p> : null}

        <section className="week-summary">
          <h3>This week</h3>

          {weeklyDays.map((day) => (
            <div key={day.date} className="day-summary">
              <button
                type="button"
                className="day-header"
                onClick={() => setExpandedDay((current) => current === day.date ? null : day.date)}
              >
                <span>{formatDisplayDate(day.date)}</span>
                <span>{formatCurrency(day.total)}</span>
              </button>

              {expandedDay === day.date || day.date === today ? (
                <div className="day-body">
                  {day.items.length === 0 ? (
                    <p className="empty-state">No expenses recorded.</p>
                  ) : (
                    <ul className="expense-list compact">
                      {day.items.map((expense) => (
                        <li key={expense.id} className="expense-item">
                          <div>
                            <p>{expense.description}</p>
                            <span>{formatCurrency(expense.amount)}</span>
                          </div>
                          <button type="button" onClick={() => void handleDelete(expense.id!)} aria-label={`Delete ${expense.description}`}>
                            Delete
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

export default Dashboard;
