import Dexie, { type Table } from "dexie";

import type { Expense } from "../types/expense";
import type { Week } from "../types/week";
import type { Settings } from "../types/settings";

export class ExpenseDatabase extends Dexie {
  expenses!: Table<Expense, number>;
  weeks!: Table<Week, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super("MyExpensesDB");

    this.version(1).stores({
      expenses: "++id, weekId, date",
      weeks: "id, startDate, endDate",
      settings: "id",
    });
  }
}

export const db = new ExpenseDatabase();