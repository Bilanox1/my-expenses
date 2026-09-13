import { useEffect, useMemo, useState } from "react";

import { exportWeekAsTxt } from "../services/txtExportService";
import { getPreviousWeeks, getWeekById } from "../services/weekService";
import type { Week } from "../types/week";
import { formatDisplayShortDate } from "../utils/dateUtils";
import { formatCurrency } from "../utils/moneyUtils";
import { getExpensesByWeek } from "../services/expenseService";

export function History() {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);
  const [expenses, setExpenses] = useState<ReturnType<typeof getExpensesByWeek> extends Promise<infer T> ? T : never>([]);
  const [loading, setLoading] = useState(true);
  const [searchDate, setSearchDate] = useState("");

  useEffect(() => {
    async function loadWeeks() {
      try {
        const allWeeks = await getPreviousWeeks();
        setWeeks(allWeeks);

        if (allWeeks.length > 0) {
          setSelectedWeekId(allWeeks[0].id);
          setSelectedWeek(allWeeks[0]);
          setExpenses(await getExpensesByWeek(allWeeks[0].id));
        }
      } finally {
        setLoading(false);
      }
    }

    void loadWeeks();
  }, []);

  const summary = useMemo(() => {
    if (!selectedWeek) {
      return { spent: 0, remaining: 0 };
    }

    const spent = expenses.reduce((total, expense) => total + expense.amount, 0);
    return {
      spent,
      remaining: selectedWeek.budget - spent,
    };
  }, [expenses, selectedWeek]);

  const visibleExpenses = useMemo(() => {
    if (!searchDate) {
      return expenses;
    }

    return expenses.filter((expense) => expense.date === searchDate);
  }, [expenses, searchDate]);

  const handleWeekChange = async (weekId: string) => {
    const week = await getWeekById(weekId);
    if (!week) {
      return;
    }

    setSelectedWeekId(weekId);
    setSelectedWeek(week);
    setSearchDate("");
    setExpenses(await getExpensesByWeek(weekId));
  };

  if (loading) {
    return <main className="app-shell"><div className="page-panel"><p>Loading previous weeks…</p></div></main>;
  }

  return (
    <main className="app-shell">
      <div className="page-panel history-layout">
        <header className="page-header">
          <div>
            <p className="eyebrow">History</p>
            <h1>Previous weeks</h1>
          </div>
          {selectedWeek ? (
            <button type="button" className="secondary-button" onClick={() => void exportWeekAsTxt(selectedWeek, expenses)}>
              Export TXT
            </button>
          ) : null}
        </header>

        <label className="date-search">
          Search by date
          <input
            type="date"
            value={searchDate}
            onChange={(event) => setSearchDate(event.target.value)}
          />
        </label>

        <div className="history-list">
          {weeks.length === 0 ? (
            <p className="empty-state">No previous weeks yet.</p>
          ) : (
            weeks.map((week) => {
              const spent = expenses
                .filter((expense) => expense.weekId === week.id)
                .reduce((total, expense) => total + expense.amount, 0);
              const remaining = week.budget - spent;

              return (
                <button
                  key={week.id}
                  type="button"
                  className={`week-card ${selectedWeekId === week.id ? "active" : ""}`}
                  onClick={() => void handleWeekChange(week.id)}
                >
                  <div>
                    <p className="week-range">{formatDisplayShortDate(week.startDate)} → {formatDisplayShortDate(week.endDate)}</p>
                  </div>
                  <div className="week-metrics">
                    <span>Spent: {formatCurrency(spent)}</span>
                    <span>Remaining: {formatCurrency(remaining)}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {selectedWeek ? (
          <section className="week-detail">
            <div className="detail-header">
              <h2>{formatDisplayShortDate(selectedWeek.startDate)} → {formatDisplayShortDate(selectedWeek.endDate)}</h2>
              <div className="detail-meta">
                <span>Spent: {formatCurrency(summary.spent)}</span>
                <span>Remaining: {formatCurrency(summary.remaining)}</span>
              </div>
            </div>

            {visibleExpenses.length === 0 ? (
              <p className="empty-state">No stored expenses for this selection.</p>
            ) : (
              <ul className="history-expense-list">
                {Array.from(new Map(visibleExpenses.map((expense) => [expense.date, [] as typeof visibleExpenses])).keys()).sort().map((date) => {
                  const dayExpenses = visibleExpenses.filter((expense) => expense.date === date);
                  const dailyTotal = dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);

                  return (
                    <li key={date} className="history-day">
                      <div className="history-day-header">
                        <strong>{new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</strong>
                        <span>{formatCurrency(dailyTotal)}</span>
                      </div>
                      <ul className="expense-list compact">
                        {dayExpenses.map((expense) => (
                          <li key={expense.id} className="expense-item">
                            <div>
                              <p>{expense.description}</p>
                              <span>{formatCurrency(expense.amount)}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}

export default History;
