import { db } from "../db/database";
import type { Settings } from "../types/settings";
import type { Week } from "../types/week";
import { formatDate } from "../utils/dateUtils";
import { DEFAULT_WEEKLY_BUDGET } from "../utils/moneyUtils";
import { getWeekEnd, getWeekId, getWeekStart } from "../utils/weekUtils";

export async function ensureDefaultSettings(): Promise<Settings> {
  const defaultSettings: Settings = {
    id: "app-settings",
    weeklyBudget: DEFAULT_WEEKLY_BUDGET,
    currency: "DH",
    weekStartsOn: 6,
  };

  const existingSettings = await db.settings.get("app-settings");

  if (existingSettings) {
    return existingSettings;
  }

  await db.settings.put(defaultSettings);

  return defaultSettings;
}

export async function getOrCreateCurrentWeek(): Promise<Week> {
  const now = new Date();
  const id = getWeekId(now);
  const existingWeek = await db.weeks.get(id);

  if (existingWeek) {
    return existingWeek;
  }

  const settings = await ensureDefaultSettings();
  const startDate = getWeekStart(now);
  const endDate = getWeekEnd(now);

  const newWeek: Week = {
    id,
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    budget: settings.weeklyBudget,
    deposit: settings.weeklyBudget,
    createdAt: new Date().toISOString(),
  };

  await db.weeks.put(newWeek);

  return newWeek;
}

export async function getWeekById(weekId: string): Promise<Week | undefined> {
  return db.weeks.get(weekId);
}

export async function getPreviousWeeks(currentWeekId?: string): Promise<Week[]> {
  const weeks = await db.weeks.orderBy("startDate").reverse().toArray();

  if (!currentWeekId) {
    return weeks;
  }

  return weeks.filter((week) => week.id !== currentWeekId);
}

export async function getCurrentWeekId(): Promise<string> {
  const week = await getOrCreateCurrentWeek();
  return week.id;
}

export async function updateWeeklyBudget(newBudget: number): Promise<Week> {
  const safeBudget = Number(newBudget);

  if (!Number.isFinite(safeBudget) || safeBudget <= 0) {
    throw new Error("Weekly budget must be greater than zero.");
  }

  const currentWeek = await getOrCreateCurrentWeek();
  const currentSettings = await ensureDefaultSettings();

  await db.settings.put({
    ...currentSettings,
    weeklyBudget: safeBudget,
  });

  await db.weeks.update(currentWeek.id, {
    budget: safeBudget,
    deposit: safeBudget,
  });

  return {
    ...currentWeek,
    budget: safeBudget,
    deposit: safeBudget,
  };
}