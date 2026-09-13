import { useEffect, useMemo, useState } from "react";

import { useCurrentWeek } from "../hooks/useCurrentWeek";
import { useExpenses } from "../hooks/useExpenses";
import { useBalance } from "../hooks/useBalance";
import { exportWeekAsTxt } from "../services/txtExportService";
import { updateWeeklyBudget } from "../services/weekService";
import { formatDisplayDate, formatDisplayShortDate } from "../utils/dateUtils";
import { formatCurrency } from "../utils/moneyUtils";
import { getWeekDates } from "../utils/weekUtils";

export function Dashboard() {
  const { week, loading: weekLoading } = useCurrentWeek();
  const { expenses, saveExpense, removeExpense, editExpense } = useExpenses(week?.id ?? null);
  const balance = useBalance(week?.budget ?? 0, expenses);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [searchDate, setSearchDate] = useState("");
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [weeklyBudgetInput, setWeeklyBudgetInput] = useState("210");
  const [showBudgetSetup, setShowBudgetSetup] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [customItem, setCustomItem] = useState("");

  const commonItems = [
    "Bread",
    "Eggs",
    "Tomatoes",
    "Onion",
    "Chicken",
    "Turkey",
    "Fish",
    "Tomato sauce",
    "Water",
    "Cleaning detergent",
    "Air freshener",
    "Bimo",
    "Olives",
    "Oranges",
    "Sugar",
    "Tea",
    "Cooking oil",
    "Spices",
    "Seasoning",
    "Rice",
    "Milk",
    "Soap",
    "Dishwashing liquid",
    "Yogurt",
    "Fruit",
    "Vegetables",
    "Cucumber",
    "Garlic",
    "Bananas",
    "Lentils",
  ];

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

  const filteredDays = useMemo(() => {
    if (!searchDate) {
      return weeklyDays;
    }

    return weeklyDays.filter((day) => day.date === searchDate);
  }, [weeklyDays, searchDate]);

  useEffect(() => {
    if (week) {
      setWeeklyBudgetInput(String(week.budget));
    }
  }, [week]);

  const handleBudgetSave = async () => {
    try {
      const parsedBudget = Number(weeklyBudgetInput);

      if (!Number.isFinite(parsedBudget) || parsedBudget <= 0) {
        setStatus("Weekly budget must be greater than zero.");
        return;
      }

      if (!week) {
        setStatus("The current week is not ready yet.");
        return;
      }

      const updatedWeek = await updateWeeklyBudget(parsedBudget);
      setStatus(`Weekly budget updated to ${formatCurrency(updatedWeek.budget)}.`);
      setShowBudgetSetup(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong while updating the budget.";
      setStatus(message);
    }
  };

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

  const handleStartEdit = (expense: (typeof expenses)[number]) => {
    setEditingExpenseId(expense.id ?? null);
    setEditDescription(expense.description);
    setEditAmount(String(expense.amount));
    setEditDate(expense.date);
  };

  const handleSaveEdit = async (expenseId: number) => {
    const cleanedDescription = editDescription.trim();
    const numericAmount = Number(editAmount);

    if (!cleanedDescription) {
      setStatus("Description is required.");
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setStatus("Amount must be greater than zero.");
      return;
    }

    await editExpense(expenseId, {
      description: cleanedDescription,
      amount: numericAmount,
      date: editDate,
    });

    setEditingExpenseId(null);
    setStatus("Expense updated.");
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

        {showBudgetSetup ? (
          <div className="expense-form">
            <label>
              Weekly budget
              <input
                type="number"
                min="1"
                step="1"
                value={weeklyBudgetInput}
                onChange={(event) => setWeeklyBudgetInput(event.target.value)}
                placeholder="210"
              />
            </label>

            <button type="button" className="primary-button" onClick={() => void handleBudgetSave()}>
              Save weekly budget
            </button>
          </div>
        ) : null}

        <form className="expense-form" onSubmit={handleSubmit}>
          <label>
            Common groceries
            <select
              value={selectedPreset}
              onChange={(event) => {
                const nextValue = event.target.value;
                setSelectedPreset(nextValue);

                if (!nextValue) {
                  setDescription("");
                  return;
                }

                if (nextValue === "custom") {
                  setDescription(customItem);
                  return;
                }

                setDescription(nextValue);
              }}
            >
              <option value="">Choose an item...</option>
              {commonItems.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
              <option value="custom">Add custom item</option>
            </select>
          </label>

          <label>
            Or type your item
            <input
              type="text"
              value={customItem}
              onChange={(event) => {
                const nextValue = event.target.value;
                setCustomItem(nextValue);
                setDescription(nextValue);
              }}
              placeholder="Bread, rice, detergent..."
              aria-label="Custom expense description"
            />
          </label>

          <label>
            What did you spend on?
            <input
              type="text"
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                setCustomItem(event.target.value);
              }}
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

        <label className="date-search">
          Search by date
          <input
            type="date"
            value={searchDate}
            onChange={(event) => setSearchDate(event.target.value)}
          />
        </label>

        {status ? <p className="status-message">{status}</p> : null}

        <section className="week-summary">
          <h3>This week</h3>

          {filteredDays.length === 0 ? (
            <p className="empty-state">No expenses for this date.</p>
          ) : (
            filteredDays.map((day) => (
              <div key={day.date} className="day-summary">
                <button
                  type="button"
                  className="day-header"
                  onClick={() => setExpandedDay((current) => current === day.date ? null : day.date)}
                >
                  <span>{formatDisplayDate(day.date)}</span>
                  <span>{formatCurrency(day.total)}</span>
                </button>

                {expandedDay === day.date ? (
                  <div className="day-body">
                    {day.items.length === 0 ? (
                      <p className="empty-state">No expenses recorded.</p>
                    ) : (
                      <ul className="expense-list compact">
                        {day.items.map((expense) => (
                          <li key={expense.id} className="expense-item">
                            {editingExpenseId === expense.id ? (
                              <div className="expense-edit-form">
                                <input
                                  type="text"
                                  value={editDescription}
                                  onChange={(event) => setEditDescription(event.target.value)}
                                />
                                <div className="expense-edit-row">
                                  <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={editAmount}
                                    onChange={(event) => setEditAmount(event.target.value)}
                                  />
                                  <input
                                    type="date"
                                    value={editDate}
                                    onChange={(event) => setEditDate(event.target.value)}
                                  />
                                </div>
                                <div className="expense-actions">
                                  <button type="button" className="secondary-button" onClick={() => void handleSaveEdit(expense.id!)}>
                                    Save
                                  </button>
                                  <button type="button" className="secondary-button" onClick={() => setEditingExpenseId(null)}>
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div>
                                  <p>{expense.description}</p>
                                  <span>{formatCurrency(expense.amount)}</span>
                                </div>
                                <div className="expense-actions">
                                  <button type="button" onClick={() => handleStartEdit(expense)} aria-label={`Edit ${expense.description}`}>
                                    Edit
                                  </button>
                                  <button type="button" onClick={() => void handleDelete(expense.id!)} aria-label={`Delete ${expense.description}`}>
                                    Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}

export default Dashboard;
