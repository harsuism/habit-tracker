"use client";

import { Button } from "@heroui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../state/context";
import { Habit } from "../state/types";

const STORAGE_KEY = "one-percent-better-reminders-v1";

type PromptState = {
  id: string;
  habitId: string;
  habitName: string;
} | null;

type ReminderStore = {
  sent: string[];
};

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

function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function loadStore(): ReminderStore {
  if (typeof window === "undefined") return { sent: [] };

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { sent: [] };
    const parsed = JSON.parse(raw) as Partial<ReminderStore>;
    return {
      sent: Array.isArray(parsed.sent) ? parsed.sent : [],
    };
  } catch {
    return { sent: [] };
  }
}

function saveStore(store: ReminderStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function isCompleted(habit: Habit, dayKey: string) {
  return habit.completedDates.includes(dayKey);
}

async function notify(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(title, { body });
    return;
  }

  if (Notification.permission === "default") {
    const result = await Notification.requestPermission();
    if (result === "granted") {
      new Notification(title, { body });
    }
  }
}

export function ReminderManager() {
  const navigate = useNavigate();
  const { state, dispatch } = useAppState();

  const [store, setStore] = useState<ReminderStore>(() => loadStore());
  const [prompt, setPrompt] = useState<PromptState>(null);
  const sentSetRef = useRef<Set<string>>(new Set(store.sent));

  useEffect(() => {
    sentSetRef.current = new Set(store.sent);
    saveStore(store);
  }, [store]);

  const activeHabits = useMemo(
    () => state.habits.filter((habit) => habit.status === "active"),
    [state.habits],
  );

  useEffect(() => {
    const sendKey = (key: string) => {
      if (sentSetRef.current.has(key)) return false;
      sentSetRef.current.add(key);
      setStore({ sent: Array.from(sentSetRef.current) });
      return true;
    };

    const checkReminders = async () => {
      const now = new Date();
      const today = dateKeyLocal(now);
      const yesterday = dateKeyLocal(shiftDate(now, -1));
      const dayBeforeYesterday = dateKeyLocal(shiftDate(now, -2));
      const hm = formatTime(now);

      for (const habit of activeHabits) {
        const completedToday = isCompleted(habit, today);

        if (habit.time && hm === habit.time) {
          const key = `scheduled:${habit.id}:${today}`;
          if (!completedToday && sendKey(key)) {
            await notify(
              "1% Better",
              `Time to cast a vote for ${habit.identity}. ${habit.action} 🗳️`,
            );
          }
        }

        if (hm === "20:00") {
          const key = `evening:${habit.id}:${today}`;
          if (!completedToday && sendKey(key)) {
            dispatch({
              type: "upsert_habit",
              payload: {
                ...habit,
                missedDates: Array.from(new Set([...(habit.missedDates ?? []), today])).sort(),
              },
            });
            await notify(
              "1% Better",
              "Still time to show up today. Even the two-minute version counts.",
            );
          }
        }

        const missedYesterday = !isCompleted(habit, yesterday);
        const missedDayBefore = !isCompleted(habit, dayBeforeYesterday);

        if (now.getHours() >= 7 && now.getHours() <= 11) {
          if (missedYesterday && !missedDayBefore) {
            const key = `comeback:${habit.id}:${today}`;
            if (sendKey(key)) {
              await notify("1% Better", "Yesterday was a miss. Today is a comeback. 💪");
            }
          }

          if (missedYesterday && missedDayBefore) {
            const key = `recovery:${habit.id}:${today}`;
            if (sendKey(key)) {
              await notify(
                "1% Better",
                `It looks like ${habit.action} has been tough this week. Want to adjust it or make it even smaller?`,
              );
              setPrompt({ id: key, habitId: habit.id, habitName: habit.action });
            }
          }
        }
      }
    };

    checkReminders();
    const interval = window.setInterval(checkReminders, 30000);
    return () => window.clearInterval(interval);
  }, [activeHabits, dispatch]);

  return (
    <>
      {prompt && (
        <div className="fixed inset-x-0 bottom-24 z-40 mx-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-lg">
          <p className="text-sm text-zinc-700">
            It looks like <span className="font-medium">{prompt.habitName}</span> has been tough this week. Want to
            adjust it or make it even smaller?
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              className="bg-amber-500 text-white hover:bg-amber-600"
              onPress={() => {
                const habit = state.habits.find((item) => item.id === prompt.habitId);
                setPrompt(null);
                if (habit) navigate(`/habits/edit/${habit.id}`);
              }}
            >
              Adjust
            </Button>
            <Button size="sm" variant="flat" onPress={() => setPrompt(null)}>
              Keep going
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
