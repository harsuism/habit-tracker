"use client";

import { Button } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAppState } from "../state/context";

export function HabitsScreen() {
  const { state } = useAppState();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"build" | "break">("build");
  const displayedHabits = state.habits.filter((habit) => habit.type === mode);

  return (
    <section className="space-y-6">
      <header className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">habits</p>
          <h2 className="font-[family-name:var(--font-instrument-serif)] text-4xl text-zinc-900">identity habits</h2>
        </div>
        <div className="inline-flex rounded-full bg-zinc-100 p-1">
          <button
            type="button"
            onClick={() => setMode("build")}
            className={[
              "rounded-full px-4 py-2 text-sm transition",
              mode === "build" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500",
            ].join(" ")}
          >
            Build a habit
          </button>
          <button
            type="button"
            onClick={() => setMode("break")}
            className={[
              "rounded-full px-4 py-2 text-sm transition",
              mode === "break" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500",
            ].join(" ")}
          >
            Break a habit
          </button>
        </div>
        <Button
          radius="full"
          className="bg-amber-500 text-white hover:bg-amber-600"
          onPress={() => navigate(mode === "build" ? "/habits/new" : "/habits/new-break")}
        >
          {mode === "build" ? "build a new habit" : "break a bad habit"}
        </Button>
      </header>

      <ul className="space-y-4">
        {displayedHabits.length === 0 && (
          <li className="rounded-2xl border border-zinc-200 bg-[#fffdf9] p-5 text-zinc-600">
            {mode === "build" ? "your build habit list is empty right now." : "your break habit list is empty right now."}
          </li>
        )}

        {displayedHabits.map((habit) => (
          <li key={habit.id} className="rounded-2xl border border-zinc-200 bg-[#fffdf9] p-5">
            <p className="text-sm uppercase tracking-wide text-zinc-500">{habit.type} habit</p>
            <h3 className="mt-2 text-lg text-zinc-900">{habit.action}</h3>
            <p className="text-zinc-600">identity: {habit.identity}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
              <span className="rounded-full border border-zinc-300 px-2 py-1">{habit.status}</span>
              <span className="rounded-full border border-zinc-300 px-2 py-1">{habit.time || "time open"}</span>
              <span className="rounded-full border border-zinc-300 px-2 py-1">{habit.location || "location open"}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
