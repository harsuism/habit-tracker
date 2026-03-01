"use client";

import { Button } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LevelUpPrompt } from "../components/LevelUpPrompt";
import { useAppState } from "../state/context";
import { applyCompletionWithNeverMissTwice } from "../state/streaks";
import { Habit } from "../state/types";

const HOLD_DURATION_MS = 1500;

const dailyQuotes = [
  "Small habits, repeated daily, become extraordinary outcomes.",
  "You don't need to be perfect. You need to keep showing up.",
  "Habits are the compound interest of self-improvement.",
  "Every action is a vote for the type of person you wish to become.",
  "The first three laws help you do it once. The fourth helps you do it again.",
  "You do not rise to the level of your goals. You fall to the level of your systems.",
  "Missing once is an accident. Missing twice is the start of a new habit.",
];

const insightPrinciples = [
  "The first three laws help you do it once. The fourth helps you do it again.",
  "You don't need to be perfect. You just need to show up.",
  "Make it obvious, make it attractive, make it easy, make it satisfying.",
  "The cost of your good habits is in the present. The cost of your bad habits is in the future.",
  "When you fall off, return quickly. Never miss twice.",
];

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

function addDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + days);
  return dateKeyLocal(date);
}

function getIdentityEmoji(identity: string): string {
  const label = identity.toLowerCase();
  if (label.includes("learn")) return "📖";
  if (label.includes("body") || label.includes("fit") || label.includes("health")) return "🏃";
  if (label.includes("creat") || label.includes("write")) return "✍️";
  if (label.includes("calm") || label.includes("focus") || label.includes("mind")) return "🧘";
  if (label.includes("profession") || label.includes("work") || label.includes("career")) return "💼";
  if (label.includes("relationship") || label.includes("friend") || label.includes("family")) return "🤝";
  if (label.includes("finance") || label.includes("money")) return "📊";
  if (label.includes("integrity") || label.includes("follow")) return "⚡";
  return "🎯";
}

function parseTimeValue(time: string): number {
  if (!time || !time.includes(":")) return Number.MAX_SAFE_INTEGER;
  const [h, m] = time.split(":").map((part) => Number(part));
  if (Number.isNaN(h) || Number.isNaN(m)) return Number.MAX_SAFE_INTEGER;
  return h * 60 + m;
}

export function TodayScreen() {
  const navigate = useNavigate();
  const { state, dispatch } = useAppState();

  const now = new Date();
  const hour = now.getHours();
  const today = dateKeyLocal(now);
  const yesterday = dateKeyLocal(shiftDate(now, -1));
  const dayBeforeYesterday = dateKeyLocal(shiftDate(now, -2));

  const greeting = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const prettyDate = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const daySeed = Math.floor(now.getTime() / 86_400_000);
  const quote = dailyQuotes[daySeed % dailyQuotes.length];
  const principle = insightPrinciples[daySeed % insightPrinciples.length];

  const activeHabits = useMemo(
    () =>
      state.habits
        .filter((habit) => habit.status === "active")
        .sort((a, b) => parseTimeValue(a.time) - parseTimeValue(b.time))
        .slice(0, 4),
    [state.habits],
  );

  const [holdHabitId, setHoldHabitId] = useState<string | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [insightState, setInsightState] = useState<"active" | "dismissed" | "saved">("active");

  const holdAnimation = useRef<number | null>(null);
  const holdStart = useRef<number>(0);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };

  const triggerHaptic = () => {
    if (typeof window !== "undefined" && typeof window.navigator?.vibrate === "function") {
      window.navigator.vibrate(25);
    }
  };

  const clearHold = () => {
    if (holdAnimation.current) {
      window.cancelAnimationFrame(holdAnimation.current);
      holdAnimation.current = null;
    }
    setHoldHabitId(null);
    setHoldProgress(0);
  };

  const buildMissStatus = (habit: Habit): "none" | "bounce" | "recovery" => {
    const completed = new Set(habit.completedDates);
    const createdOn = dateKeyLocal(new Date(habit.createdAt));

    if (createdOn > yesterday) return "none";

    const missedYesterday = !completed.has(yesterday);
    if (!missedYesterday) return "none";

    if (createdOn > dayBeforeYesterday) return "bounce";

    const missedDayBefore = !completed.has(dayBeforeYesterday);
    return missedDayBefore ? "recovery" : "bounce";
  };

  const breakSlipStatus = (habit: Habit): "none" | "bounce" | "recovery" => {
    const slips = new Set(habit.slipDates ?? []);
    const createdOn = dateKeyLocal(new Date(habit.createdAt));

    if (createdOn > yesterday) return "none";

    const slippedYesterday = slips.has(yesterday);
    if (!slippedYesterday) return "none";

    if (createdOn > dayBeforeYesterday) return "bounce";

    return slips.has(dayBeforeYesterday) ? "recovery" : "bounce";
  };

  const completeBuildHabit = (habit: Habit) => {
    if (habit.completedDates.includes(today)) return;
    const result = applyCompletionWithNeverMissTwice(habit, habit.completedDates, today);

    dispatch({
      type: "upsert_habit",
      payload: {
        ...habit,
        streak: result.streak,
        longestStreak: result.longestStreak,
        completedDates: result.completedDates,
        missedDates: habit.missedDates.filter((day) => day !== today),
      },
    });

    triggerHaptic();
    showToast(`Vote cast for ${habit.identity}! 🗳️`);
  };

  const startHold = (habit: Habit) => {
    if (habit.type !== "build") return;
    if (habit.completedDates.includes(today)) return;

    setHoldHabitId(habit.id);
    holdStart.current = 0;

    const tick = (timestamp: number) => {
      if (holdStart.current === 0) holdStart.current = timestamp;
      const elapsed = timestamp - holdStart.current;
      const progress = Math.min(elapsed / HOLD_DURATION_MS, 1);
      setHoldProgress(progress);

      if (progress >= 1) {
        clearHold();
        completeBuildHabit(habit);
        return;
      }

      holdAnimation.current = window.requestAnimationFrame(tick);
    };

    holdAnimation.current = window.requestAnimationFrame(tick);
  };

  const logBreakAvoided = (habit: Habit) => {
    if (habit.type !== "break") return;
    if (habit.completedDates.includes(today)) return;
    const result = applyCompletionWithNeverMissTwice(habit, habit.completedDates, today);
    const slips = new Set(habit.slipDates ?? []);
    slips.delete(today);

    dispatch({
      type: "upsert_habit",
      payload: {
        ...habit,
        streak: result.streak,
        longestStreak: result.longestStreak,
        completedDates: result.completedDates,
        missedDates: habit.missedDates.filter((day) => day !== today),
        slipDates: Array.from(slips).sort(),
      },
    });

    triggerHaptic();
    showToast(`Vote cast for ${habit.identity}! 🗳️`);
  };

  const logBreakSlip = (habit: Habit) => {
    if (habit.type !== "break") return;

    const slips = new Set(habit.slipDates ?? []);
    slips.add(today);

    dispatch({
      type: "upsert_habit",
      payload: {
        ...habit,
        missedDates: Array.from(new Set([...(habit.missedDates ?? []), today])).sort(),
        slipDates: Array.from(slips).sort(),
      },
    });

    showToast("That's okay. One slip doesn't define you. What matters is what you do next.");
  };

  const activeCount = activeHabits.length;
  const levelUpHabit =
    state.habits
      .filter((habit) => habit.status === "active" && habit.type === "build")
      .find((habit) => {
        const nextThreshold = habit.nextLevelUpAt ?? 30;
        const snoozed = habit.levelUpSnoozeUntil && today <= habit.levelUpSnoozeUntil;
        return !snoozed && habit.streak >= nextThreshold;
      }) ?? null;

  const handleLevelUp = (nextTwoMinute: string) => {
    if (!levelUpHabit) return;
    dispatch({
      type: "upsert_habit",
      payload: {
        ...levelUpHabit,
        twoMinuteVersion: nextTwoMinute,
        levelUpHistory: [
          ...levelUpHabit.levelUpHistory,
          {
            date: new Date().toISOString(),
            from: levelUpHabit.twoMinuteVersion,
            to: nextTwoMinute,
          },
        ],
        nextLevelUpAt: levelUpHabit.streak + 30,
        levelUpSnoozeUntil: undefined,
      },
    });
    showToast("leveled up. your system just stretched.");
  };

  const handleKeepCurrent = () => {
    if (!levelUpHabit) return;
    dispatch({
      type: "upsert_habit",
      payload: {
        ...levelUpHabit,
        levelUpSnoozeUntil: addDays(today, 30),
      },
    });
  };

  const handleMastered = () => {
    if (!levelUpHabit) return;
    dispatch({
      type: "upsert_habit",
      payload: {
        ...levelUpHabit,
        status: "mastered",
        archivedAt: new Date().toISOString(),
      },
    });
    showToast("moved to hall of fame.");
  };

  return (
    <section className="space-y-8 pb-4">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-[0.16em] text-zinc-500">today</p>
        <h2 className="font-[family-name:var(--font-instrument-serif)] text-4xl leading-tight text-zinc-900 sm:text-5xl">
          Good {greeting}, {state.user.name}
        </h2>
        <p className="text-zinc-500">{prettyDate}</p>
        <p className="max-w-2xl text-zinc-600">{quote}</p>
      </header>

      {activeCount === 0 ? (
        <div className="flex min-h-[52vh] flex-col items-center justify-center rounded-3xl border border-zinc-200 bg-[#fffdf9] px-6 text-center">
          <div className="mb-4 text-4xl">◌</div>
          <h3 className="font-[family-name:var(--font-instrument-serif)] text-3xl text-zinc-900">
            Your system starts with one tiny habit.
          </h3>
          <Button
            className="mt-8 bg-amber-500 px-8 text-white hover:bg-amber-600"
            radius="full"
            onPress={() => navigate("/habits/new")}
          >
            Create your first habit →
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-5">
            {activeHabits.map((habit) => {
              const completedToday = habit.completedDates.includes(today);
              const buildStatus = habit.type === "build" ? buildMissStatus(habit) : "none";
              const breakStatus = habit.type === "break" ? breakSlipStatus(habit) : "none";
              const isHolding = holdHabitId === habit.id;
              const progressDeg = Math.round((isHolding ? holdProgress : 0) * 360);
              const slippedToday = (habit.slipDates ?? []).includes(today);

              const baseCardClass =
                habit.type === "break"
                  ? completedToday
                    ? "border-zinc-700 bg-zinc-800 text-zinc-50"
                    : breakStatus === "bounce" || breakStatus === "recovery"
                      ? "border-amber-300 bg-amber-50/60"
                      : "border-zinc-300 bg-zinc-100/70"
                  : completedToday
                    ? "border-emerald-200 bg-emerald-50/70"
                    : buildStatus === "bounce" || buildStatus === "recovery"
                      ? "border-amber-200 bg-amber-50/50"
                      : "border-zinc-200 bg-[#fffdf9]";

              return (
                <motion.article
                  key={habit.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={[
                    "rounded-3xl border p-5 shadow-[0_8px_20px_rgba(20,20,20,0.04)] transition",
                    baseCardClass,
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className={habit.type === "break" && completedToday ? "text-zinc-100" : "text-zinc-800"}>
                      {getIdentityEmoji(habit.identity)} {habit.identity}
                    </p>
                  </div>

                  <p className={["mt-4 text-2xl leading-tight", habit.type === "break" && completedToday ? "text-white" : "text-zinc-900"].join(" ")}>
                    {habit.type === "break" ? `Avoid ${habit.action}` : habit.twoMinuteVersion}
                  </p>
                  <p className={["mt-2", habit.type === "break" && completedToday ? "text-zinc-200" : "text-zinc-500"].join(" ")}>
                    {habit.time || "Any time"} · {habit.location || "Anywhere"}
                  </p>

                  <p className={["mt-4", habit.type === "break" && completedToday ? "text-zinc-100" : "text-zinc-700"].join(" ")}>
                    🔥 {habit.streak} {habit.type === "break" ? "days free" : "day streak"}
                  </p>

                  {habit.type === "build" && buildStatus === "bounce" && !completedToday && (
                    <p className="mt-2 text-sm text-amber-700">Bounce back today.</p>
                  )}
                  {habit.type === "build" && buildStatus === "recovery" && !completedToday && (
                    <p className="mt-2 text-sm text-amber-700">Missing once is an accident. Let&apos;s get back today.</p>
                  )}

                  {habit.type === "break" && breakStatus === "bounce" && !completedToday && !slippedToday && (
                    <p className="mt-2 text-sm text-amber-700">Bounce back today.</p>
                  )}
                  {habit.type === "break" && breakStatus === "recovery" && !completedToday && !slippedToday && (
                    <p className="mt-2 text-sm text-amber-700">Missing once is an accident. Let&apos;s get back today.</p>
                  )}

                  <div className="mt-5 flex items-center justify-end gap-3">
                    {habit.type === "build" ? (
                      !completedToday ? (
                        <>
                          <button
                            type="button"
                            aria-label={`Hold to complete ${habit.twoMinuteVersion}`}
                            onPointerDown={() => startHold(habit)}
                            onPointerUp={clearHold}
                            onPointerCancel={clearHold}
                            onPointerLeave={clearHold}
                            className="relative grid h-12 w-12 place-items-center rounded-full"
                            style={{
                              background: `conic-gradient(#d97706 ${progressDeg}deg, #e4e4e7 0deg)`,
                            }}
                          >
                            <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-zinc-500">◯</span>
                          </button>
                          <p className="text-sm text-zinc-500">Hold to complete</p>
                        </>
                      ) : (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="grid h-12 w-12 place-items-center rounded-full bg-emerald-500 text-white"
                        >
                          ✓
                        </motion.div>
                      )
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          radius="full"
                          className="bg-emerald-500 text-white hover:bg-emerald-600"
                          onPress={() => logBreakAvoided(habit)}
                        >
                          Yes ✓
                        </Button>
                        <Button size="sm" radius="full" variant="flat" onPress={() => logBreakSlip(habit)}>
                          No, I slipped
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </div>

          <AnimatePresence>
            {insightState === "active" && (
              <motion.article
                key="insight"
                drag="x"
                dragConstraints={{ left: -120, right: 120 }}
                dragElastic={0.15}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -80) setInsightState("dismissed");
                  if (info.offset.x > 80) setInsightState("saved");
                }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -80 }}
                className="rounded-3xl border border-zinc-200 bg-[#fffdf9] p-5"
              >
                <p className="text-sm uppercase tracking-[0.16em] text-zinc-500">daily insight</p>
                <p className="mt-3 text-zinc-700">{principle}</p>
                <p className="mt-4 text-xs text-zinc-400">swipe left to dismiss · right to save</p>
              </motion.article>
            )}
          </AnimatePresence>

          {insightState !== "active" && (
            <div className="rounded-2xl bg-zinc-100/70 px-4 py-3 text-sm text-zinc-600">
              {insightState === "saved" ? "Insight saved for later." : "Insight dismissed for today."}
            </div>
          )}
        </>
      )}

      {activeCount < 4 && activeCount > 0 && (
        <Button
          isIconOnly
          radius="full"
          className="fixed bottom-24 right-6 z-30 bg-amber-500 text-2xl text-white shadow-lg hover:bg-amber-600"
          onPress={() => navigate("/habits/new")}
        >
          +
        </Button>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full bg-zinc-900 px-4 py-2 text-sm text-white"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <LevelUpPrompt
        key={levelUpHabit?.id ?? "no-level-up"}
        habit={levelUpHabit}
        onLevelUp={handleLevelUp}
        onKeepCurrent={handleKeepCurrent}
        onMastered={handleMastered}
        onClose={handleKeepCurrent}
      />
    </section>
  );
}
