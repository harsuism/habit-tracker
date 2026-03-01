"use client";

import { Button } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../state/context";
import { Reflection } from "../state/types";

type HabitDecision = "keep" | "adjust" | "mastered";

const pageVariants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
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

function parseDay(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

export function WeeklyReflectionScreen() {
  const navigate = useNavigate();
  const { state, dispatch } = useAppState();

  const activeHabits = state.habits.filter((habit) => habit.status === "active");
  const todayKey = dateKeyLocal(new Date());
  const weekKeys = Array.from({ length: 7 }, (_, index) => dateKeyLocal(shiftDate(new Date(), index - 6)));

  const [page, setPage] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, HabitDecision>>(() =>
    Object.fromEntries(activeHabits.map((habit) => [habit.id, "keep"])),
  );
  const [confidence, setConfidence] = useState<Record<string, number>>(() =>
    Object.fromEntries(activeHabits.map((habit) => [habit.id, 7])),
  );

  const createId = () =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 10);

  const weekStats = useMemo(() => {
    const habitRows = activeHabits.map((habit) => {
      const completedSet = new Set(habit.completedDates);
      const dots = weekKeys.map((day) => completedSet.has(day));
      const completed = dots.filter(Boolean).length;
      return {
        habit,
        dots,
        completed,
      };
    });

    const totalCompleted = habitRows.reduce((sum, row) => sum + row.completed, 0);
    const totalPossible = activeHabits.length * 7;
    const completionRate = totalPossible === 0 ? 0 : Math.round((totalCompleted / totalPossible) * 100);

    const identityVotesMap = habitRows.reduce<Record<string, number>>((acc, row) => {
      acc[row.habit.identity] = (acc[row.habit.identity] ?? 0) + row.completed;
      return acc;
    }, {});

    const longest = activeHabits.reduce(
      (best, habit) => (habit.streak > best.streak ? { streak: habit.streak, action: habit.action } : best),
      { streak: 0, action: "-" },
    );

    return {
      habitRows,
      totalCompleted,
      totalPossible,
      completionRate,
      identityVotesMap,
      longest,
    };
  }, [activeHabits, weekKeys]);

  const systemInsight = useMemo(() => {
    const todayDate = parseDay(todayKey);
    const monthKeys = Array.from({ length: 30 }, (_, index) => dateKeyLocal(shiftDate(todayDate, -index)));

    const weekdayTotals = { completed: 0, possible: 0 };
    const weekendTotals = { completed: 0, possible: 0 };

    activeHabits.forEach((habit) => {
      const completedSet = new Set(habit.completedDates);
      monthKeys.forEach((dayKey) => {
        const day = parseDay(dayKey).getDay();
        const isWeekend = day === 0 || day === 6;
        if (isWeekend) {
          weekendTotals.possible += 1;
          if (completedSet.has(dayKey)) weekendTotals.completed += 1;
        } else {
          weekdayTotals.possible += 1;
          if (completedSet.has(dayKey)) weekdayTotals.completed += 1;
        }
      });
    });

    const weekdayRate = weekdayTotals.possible ? weekdayTotals.completed / weekdayTotals.possible : 0;
    const weekendRate = weekendTotals.possible ? weekendTotals.completed / weekendTotals.possible : 0;

    const topIdentity = Object.entries(weekStats.identityVotesMap).sort((a, b) => b[1] - a[1])[0];

    const totalMonthVotes = activeHabits.reduce((sum, habit) => {
      const monthCount = habit.completedDates.filter((d) => monthKeys.includes(d)).length;
      return sum + monthCount;
    }, 0);

    return {
      pattern:
        weekdayRate > weekendRate + 0.15
          ? "You complete habits more consistently on weekdays. Consider adjusting weekend routines."
          : weekendRate > weekdayRate + 0.15
            ? "Your weekends are your momentum zone. Mirror that rhythm into weekdays."
            : "Your consistency is balanced across the week. Keep your system simple and repeatable.",
      streak: topIdentity
        ? `You've cast ${totalMonthVotes} votes for ${topIdentity[0]} this month. That's real momentum.`
        : "Each completed habit is a vote for the identity you're building.",
      support:
        weekStats.completionRate < 55
          ? "Remember - just showing up in the two-minute version counts. Don't let perfect be the enemy of good."
          : "Your system is working. Keep protecting the small actions that make consistency automatic.",
    };
  }, [activeHabits, todayKey, weekStats.completionRate, weekStats.identityVotesMap]);

  const saveAndClose = () => {
    const updatedHabits = state.habits.map((habit) => {
      const decision = decisions[habit.id];
      if (!decision || habit.status !== "active") return habit;
      if (decision === "mastered") {
        return {
          ...habit,
          status: "mastered" as const,
          archivedAt: new Date().toISOString(),
          masteredAt: new Date().toISOString(),
        };
      }
      return habit;
    });

    updatedHabits.forEach((habit) => {
      const original = state.habits.find((item) => item.id === habit.id);
      if (!original) return;
      if (habit !== original) {
        dispatch({ type: "upsert_habit", payload: habit });
      }
    });

    const reflectionDate = todayKey;
    const newReflections: Reflection[] = activeHabits.map((habit) => {
      const decision = decisions[habit.id] ?? "keep";
      return {
        id: createId(),
        date: reflectionDate,
        habitId: habit.id,
        confidence: confidence[habit.id] ?? 7,
        decision: decision === "mastered" ? "master" : "keep",
        note: null,
      };
    });

    dispatch({ type: "set_reflections", payload: [...state.reflections, ...newReflections] });
    navigate("/progress");
  };

  return (
    <section className="mx-auto w-full max-w-3xl space-y-8 pb-20">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-[0.16em] text-zinc-500">weekly reflection</p>
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((dot) => (
            <div key={dot} className={["h-1.5 flex-1 rounded-full", dot <= page ? "bg-amber-500" : "bg-zinc-200"].join(" ")} />
          ))}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {page === 0 && (
          <motion.article key="summary" {...pageVariants} className="space-y-6">
            <h1 className="font-[family-name:var(--font-instrument-serif)] text-4xl text-zinc-900 sm:text-5xl">
              Your week at a glance
            </h1>

            <div className="grid gap-3 sm:grid-cols-2">
              <article className="rounded-2xl bg-[#fffdf9] p-5 text-center">
                <p className="text-4xl font-semibold text-zinc-900">{weekStats.totalCompleted}</p>
                <p className="text-sm text-zinc-500">of {weekStats.totalPossible} completed</p>
              </article>
              <article className="rounded-2xl bg-[#fffdf9] p-5 text-center">
                <p className="text-4xl font-semibold text-zinc-900">{weekStats.completionRate}%</p>
                <p className="text-sm text-zinc-500">completion rate</p>
              </article>
              <article className="rounded-2xl bg-[#fffdf9] p-5 text-center">
                <p className="text-4xl font-semibold text-zinc-900">
                  {Object.values(weekStats.identityVotesMap).reduce((sum, value) => sum + value, 0)}
                </p>
                <p className="text-sm text-zinc-500">identity votes cast</p>
              </article>
              <article className="rounded-2xl bg-[#fffdf9] p-5 text-center">
                <p className="text-4xl font-semibold text-zinc-900">{weekStats.longest.streak}</p>
                <p className="text-sm text-zinc-500">longest streak · {weekStats.longest.action}</p>
              </article>
            </div>

            <div className="space-y-3 rounded-2xl bg-[#fffdf9] p-5">
              {Object.entries(weekStats.identityVotesMap).map(([identity, votes]) => (
                <p key={identity} className="text-sm text-zinc-600">
                  {identity}: <span className="font-medium text-zinc-900">{votes}</span>
                </p>
              ))}
            </div>

            <div className="space-y-3 rounded-2xl bg-[#fffdf9] p-5">
              {weekStats.habitRows.map(({ habit, dots }) => (
                <div key={habit.id} className="flex items-center justify-between gap-3">
                  <p className="text-sm text-zinc-700">{habit.twoMinuteVersion}</p>
                  <div className="flex gap-1.5">
                    {dots.map((done, idx) => (
                      <span key={`${habit.id}-${idx}`} className={["h-2.5 w-2.5 rounded-full", done ? "bg-amber-500" : "bg-zinc-300"].join(" ")} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.article>
        )}

        {page === 1 && (
          <motion.article key="habit-review" {...pageVariants} className="space-y-6">
            <h1 className="font-[family-name:var(--font-instrument-serif)] text-4xl text-zinc-900 sm:text-5xl">Per-habit review</h1>

            <div className="space-y-4">
              {weekStats.habitRows.map(({ habit, dots, completed }) => (
                <article key={habit.id} className="space-y-4 rounded-2xl bg-[#fffdf9] p-5">
                  <p className="text-zinc-900">{habit.twoMinuteVersion}</p>
                  <p className="text-sm text-zinc-500">this week: {completed}/7 completed</p>
                  <div className="flex gap-1.5">
                    {dots.map((done, idx) => (
                      <span key={`${habit.id}-review-${idx}`} className={["h-2.5 w-2.5 rounded-full", done ? "bg-amber-500" : "bg-zinc-300"].join(" ")} />
                    ))}
                  </div>

                  <p className="text-zinc-700">Is this habit still serving who you&apos;re becoming?</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setDecisions((current) => ({ ...current, [habit.id]: "keep" }))}
                      className={[
                        "rounded-full px-4 py-2 text-sm",
                        decisions[habit.id] === "keep" ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-600",
                      ].join(" ")}
                    >
                      ✓ Yes, keep going
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/habits/edit/${habit.id}`)}
                      className="rounded-full bg-zinc-100 px-4 py-2 text-sm text-zinc-600"
                    >
                      ✏️ Adjust it
                    </button>
                    <button
                      type="button"
                      onClick={() => setDecisions((current) => ({ ...current, [habit.id]: "mastered" }))}
                      className={[
                        "rounded-full px-4 py-2 text-sm",
                        decisions[habit.id] === "mastered" ? "bg-amber-100 text-amber-800" : "bg-zinc-100 text-zinc-600",
                      ].join(" ")}
                    >
                      🏆 Move to Hall of Fame
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </motion.article>
        )}

        {page === 2 && (
          <motion.article key="confidence" {...pageVariants} className="space-y-6">
            <h1 className="font-[family-name:var(--font-instrument-serif)] text-4xl text-zinc-900 sm:text-5xl">Confidence pulse</h1>

            <div className="space-y-4">
              {activeHabits.map((habit) => (
                <article key={habit.id} className="space-y-3 rounded-2xl bg-[#fffdf9] p-5">
                  <p className="text-zinc-800">How confident are you that {habit.twoMinuteVersion} will stick?</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500">Not at all</span>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={confidence[habit.id] ?? 7}
                      onChange={(event) =>
                        setConfidence((current) => ({ ...current, [habit.id]: Number(event.target.value) }))
                      }
                      className="h-2 w-full accent-amber-500"
                    />
                    <span className="text-xs text-zinc-500">Completely</span>
                  </div>
                  <p className="text-sm text-zinc-600">{confidence[habit.id] ?? 7}/10</p>
                </article>
              ))}
            </div>
          </motion.article>
        )}

        {page === 3 && (
          <motion.article key="insight" {...pageVariants} className="space-y-6">
            <h1 className="font-[family-name:var(--font-instrument-serif)] text-4xl text-zinc-900 sm:text-5xl">System insight</h1>

            <div className="space-y-4 rounded-3xl bg-[#fffdf9] p-6">
              <p className="text-zinc-700">{systemInsight.pattern}</p>
              <p className="text-zinc-700">{systemInsight.streak}</p>
              <p className="text-zinc-700">{systemInsight.support}</p>
            </div>

            <Button className="bg-amber-500 text-white hover:bg-amber-600" radius="full" onPress={saveAndClose}>
              Back to my system →
            </Button>
          </motion.article>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <Button variant="light" onPress={() => (page === 0 ? navigate("/progress") : setPage((current) => current - 1))}>
          back
        </Button>
        {page < 3 && (
          <Button className="bg-zinc-900 text-white hover:bg-zinc-800" onPress={() => setPage((current) => current + 1)}>
            next
          </Button>
        )}
      </div>
    </section>
  );
}
