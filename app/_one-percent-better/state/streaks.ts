import { Habit } from "./types";

function dateKeyLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftDate(base: Date, offsetDays: number): Date {
  const next = new Date(base);
  next.setDate(base.getDate() + offsetDays);
  return next;
}

function isSetHit(set: Set<string>, key: string) {
  return set.has(key);
}

export type StreakStatus = "clean" | "grace" | "broken";

export function evaluateNeverMissTwiceStatus(
  completedDates: string[],
  todayKey = dateKeyLocal(new Date()),
): StreakStatus {
  const completedSet = new Set(completedDates);
  const yesterday = dateKeyLocal(shiftDate(new Date(`${todayKey}T00:00:00`), -1));
  const dayBeforeYesterday = dateKeyLocal(shiftDate(new Date(`${todayKey}T00:00:00`), -2));

  const completedYesterday = isSetHit(completedSet, yesterday);
  const completedDayBefore = isSetHit(completedSet, dayBeforeYesterday);

  if (completedYesterday) return "clean";
  if (!completedYesterday && completedDayBefore) return "grace";
  return "broken";
}

export function applyCompletionWithNeverMissTwice(
  habit: Habit,
  completedDates: string[],
  todayKey = dateKeyLocal(new Date()),
) {
  const uniqueCompleted = Array.from(new Set([...completedDates, todayKey])).sort();
  const status = evaluateNeverMissTwiceStatus(uniqueCompleted, todayKey);

  const nextStreak = status === "broken" ? 1 : Math.max(1, habit.streak + 1);
  const nextLongest = Math.max(habit.longestStreak, nextStreak);

  return {
    streak: nextStreak,
    longestStreak: nextLongest,
    completedDates: uniqueCompleted,
  };
}

export function markMissedDate(habit: Habit, dateKey: string) {
  if (habit.completedDates.includes(dateKey)) {
    return habit.missedDates;
  }
  return Array.from(new Set([...(habit.missedDates ?? []), dateKey])).sort();
}
