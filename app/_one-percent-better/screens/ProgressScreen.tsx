"use client";

import { Button } from "@heroui/react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../state/context";

function dateKeyLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDay(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function shiftDate(base: Date, offset: number): Date {
  const next = new Date(base);
  next.setDate(base.getDate() + offset);
  return next;
}

function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatMonthTitle(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function completionIntensity(count: number): string {
  if (count <= 0) return "bg-zinc-200";
  if (count === 1) return "bg-amber-200";
  if (count === 2) return "bg-amber-300";
  return "bg-amber-500";
}

function buildPath(points: number[], width: number, height: number, minY = 0): string {
  if (points.length === 0) return "";
  const max = Math.max(...points, 1);
  const min = minY;
  const padX = 14;
  const padY = 10;
  const usableW = width - padX * 2;
  const usableH = height - padY * 2;

  return points
    .map((value, index) => {
      const x = padX + (index / Math.max(points.length - 1, 1)) * usableW;
      const normalized = (value - min) / Math.max(max - min, 1);
      const y = height - padY - normalized * usableH;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export function ProgressScreen() {
  const { state } = useAppState();
  const navigate = useNavigate();
  const todayKey = dateKeyLocal(new Date());
  const todayDate = parseDay(todayKey);
  const [activeMonth, setActiveMonth] = useState(monthStart(todayDate));

  const allCompletionsByDay = useMemo(() => {
    const map = new Map<string, number>();
    state.habits.forEach((habit) => {
      habit.completedDates.forEach((day) => {
        map.set(day, (map.get(day) ?? 0) + 1);
      });
    });
    return map;
  }, [state.habits]);

  const identityStats = useMemo(() => {
    const identities = Array.from(new Set([...state.user.identities, ...state.habits.map((h) => h.identity)])).filter(Boolean);
    const thisMonthPrefix = todayKey.slice(0, 7);

    return identities.map((identity) => {
      const habits = state.habits.filter((habit) => habit.identity === identity);
      const totalVotes = habits.reduce((sum, habit) => sum + habit.completedDates.length, 0);
      const monthVotes = habits.reduce(
        (sum, habit) => sum + habit.completedDates.filter((d) => d.startsWith(thisMonthPrefix)).length,
        0,
      );
      return { identity, totalVotes, monthVotes };
    });
  }, [state.habits, state.user.identities, todayKey]);

  const streakInfo = useMemo(() => {
    let streak = 0;
    for (let i = 0; i < 3650; i += 1) {
      const key = dateKeyLocal(shiftDate(todayDate, -i));
      if ((allCompletionsByDay.get(key) ?? 0) > 0) {
        streak += 1;
      } else {
        break;
      }
    }
    return streak;
  }, [allCompletionsByDay, todayDate]);

  const monthGrid = useMemo(() => {
    const first = monthStart(activeMonth);
    const year = first.getFullYear();
    const month = first.getMonth();
    const startWeekday = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: Array<{ day: number; key: string; count: number } | null> = [];
    for (let i = 0; i < startWeekday; i += 1) cells.push(null);

    for (let day = 1; day <= daysInMonth; day += 1) {
      const key = dateKeyLocal(new Date(year, month, day));
      cells.push({ day, key, count: allCompletionsByDay.get(key) ?? 0 });
    }

    return cells;
  }, [activeMonth, allCompletionsByDay]);

  const curveData = useMemo(() => {
    const createdDates = state.habits.map((habit) => new Date(habit.createdAt).getTime());
    if (createdDates.length === 0) {
      return {
        actual: [0, 0],
        theoretical: [0, 1],
        startLabel: "start",
        currentLabel: "today",
      };
    }

    const startDate = new Date(Math.min(...createdDates));
    const totalDays = Math.max(
      1,
      Math.floor((todayDate.getTime() - startDate.getTime()) / 86_400_000),
    );
    const points = Math.min(18, Math.max(6, Math.ceil(totalDays / 7)));

    const actual: number[] = [];
    const theoreticalRaw: number[] = [];
    for (let i = 0; i < points; i += 1) {
      const dayOffset = Math.round((i / Math.max(points - 1, 1)) * totalDays);
      const pointDate = dateKeyLocal(shiftDate(startDate, dayOffset));

      let cumulative = 0;
      allCompletionsByDay.forEach((count, key) => {
        if (key <= pointDate) cumulative += count;
      });
      actual.push(cumulative);

      theoreticalRaw.push(Math.pow(1.01, dayOffset) - 1);
    }

    const maxActual = Math.max(...actual, 1);
    const maxTheo = Math.max(...theoreticalRaw, 1);
    const theoretical = theoreticalRaw.map((value) => (value / maxTheo) * maxActual);

    return {
      actual,
      theoretical,
      startLabel: startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      currentLabel: todayDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
  }, [allCompletionsByDay, state.habits, todayDate]);

  const masteredHabits = useMemo(
    () => state.habits.filter((habit) => habit.status === "mastered"),
    [state.habits],
  );

  return (
    <section className="space-y-8 pb-4">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">progress</p>
        <h2 className="font-[family-name:var(--font-instrument-serif)] text-4xl text-zinc-900">long-term trajectory</h2>
        <Button radius="full" className="mt-2 bg-amber-500 text-white hover:bg-amber-600" onPress={() => navigate("/reflection")}>
          weekly reflection
        </Button>
      </header>

      <section className="space-y-4">
        <h3 className="font-[family-name:var(--font-instrument-serif)] text-3xl text-zinc-900">Identity votes</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {identityStats.map((item) => {
            const fullness = Math.min(100, (item.totalVotes / 180) * 100);
            return (
              <article key={item.identity} className="rounded-2xl bg-[#fffdf9] p-5 shadow-[0_6px_20px_rgba(20,20,20,0.04)]">
                <p className="text-zinc-700">{item.identity}</p>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-4xl font-semibold text-zinc-900">{item.totalVotes}</p>
                    <p className="text-sm text-zinc-500">{item.monthVotes} votes this month</p>
                  </div>
                  <div
                    className="grid h-16 w-16 place-items-center rounded-full"
                    style={{ background: `conic-gradient(#d97706 ${fullness * 3.6}deg, #e4e4e7 0deg)` }}
                  >
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-[#fffdf9] text-xs text-zinc-500">
                      {Math.round(fullness)}%
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
          {identityStats.length === 0 && (
            <article className="rounded-2xl bg-[#fffdf9] p-5 text-zinc-500 sm:col-span-2">no identities tracked yet.</article>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-[family-name:var(--font-instrument-serif)] text-3xl text-zinc-900">Streak calendar</h3>
          <p className="text-zinc-600">current streak: <span className="font-semibold text-zinc-900">{streakInfo} days</span></p>
        </div>

        <motion.article
          drag="x"
          dragConstraints={{ left: -120, right: 120 }}
          onDragEnd={(_, info) => {
            if (info.offset.x < -70) {
              setActiveMonth((current) => monthStart(new Date(current.getFullYear(), current.getMonth() + 1, 1)));
            }
            if (info.offset.x > 70) {
              setActiveMonth((current) => monthStart(new Date(current.getFullYear(), current.getMonth() - 1, 1)));
            }
          }}
          className="rounded-2xl bg-[#fffdf9] p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <Button size="sm" variant="light" onPress={() => setActiveMonth((current) => monthStart(new Date(current.getFullYear(), current.getMonth() - 1, 1)))}>
              prev
            </Button>
            <p className="text-zinc-700">{formatMonthTitle(activeMonth)}</p>
            <Button size="sm" variant="light" onPress={() => setActiveMonth((current) => monthStart(new Date(current.getFullYear(), current.getMonth() + 1, 1)))}>
              next
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {monthGrid.map((cell, idx) => (
              <div
                key={cell ? cell.key : `empty-${idx}`}
                className={[
                  "h-7 rounded-md",
                  cell ? completionIntensity(cell.count) : "bg-transparent",
                ].join(" ")}
                title={cell ? `${cell.key}: ${cell.count} completions` : ""}
              />
            ))}
          </div>
        </motion.article>
      </section>

      <section className="space-y-4">
        <h3 className="font-[family-name:var(--font-instrument-serif)] text-3xl text-zinc-900">Your compound growth</h3>
        <article className="rounded-2xl bg-[#fffdf9] p-5">
          <svg viewBox="0 0 420 180" className="h-44 w-full">
            <path d={buildPath(curveData.theoretical, 420, 180)} fill="none" stroke="#a1a1aa" strokeWidth="1.6" strokeDasharray="5 5" />
            <path d={buildPath(curveData.actual, 420, 180)} fill="none" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
            <span>{curveData.startLabel}</span>
            <span>{curveData.currentLabel}</span>
          </div>
        </article>
      </section>

      <section className="space-y-4">
        <h3 className="font-[family-name:var(--font-instrument-serif)] text-3xl text-zinc-900">Hall of Fame</h3>
        <div className="space-y-3">
          {masteredHabits.map((habit) => (
            <article key={habit.id} className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
              <p className="text-lg text-zinc-900">{habit.type === "break" ? `Avoid ${habit.action}` : habit.action}</p>
              <p className="mt-1 text-zinc-700">served: {habit.identity}</p>
              <p className="mt-1 text-zinc-700">best streak before mastering: {habit.streak} days</p>
              <p className="mt-1 text-sm text-zinc-500">
                archived: {habit.archivedAt ? new Date(habit.archivedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
              </p>
            </article>
          ))}
          {masteredHabits.length === 0 && (
            <article className="rounded-2xl bg-[#fffdf9] p-5 text-zinc-500">your mastered habits will appear here as milestones.</article>
          )}
        </div>
      </section>
    </section>
  );
}
