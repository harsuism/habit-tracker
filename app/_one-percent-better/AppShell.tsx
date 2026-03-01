"use client";

import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { BottomTabs } from "./navigation/BottomTabs";
import { BreakHabitWizard } from "./screens/BreakHabitWizard";
import { HabitCreationWizard } from "./screens/HabitCreationWizard";
import { HabitEditScreen } from "./screens/HabitEditScreen";
import { HabitsScreen } from "./screens/HabitsScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { ProgressScreen } from "./screens/ProgressScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { TodayScreen } from "./screens/TodayScreen";
import { WeeklyReflectionScreen } from "./screens/WeeklyReflectionScreen";
import { useAppState } from "./state/context";
import { ReminderManager } from "./components/ReminderManager";

function dayDiff(fromDate: string, toDate: string) {
  const from = new Date(`${fromDate}T00:00:00`).getTime();
  const to = new Date(`${toDate}T00:00:00`).getTime();
  return Math.floor((to - from) / 86_400_000);
}

function dateKeyLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function AppShell() {
  const { state, dispatch } = useAppState();
  const location = useLocation();
  const navigate = useNavigate();
  const isWizardRoute =
    location.pathname === "/habits/new" ||
    location.pathname === "/habits/new-break" ||
    location.pathname === "/reflection" ||
    location.pathname.startsWith("/habits/edit/");

  useEffect(() => {
    if (!state.user.onboardingComplete) return;
    if (location.pathname === "/reflection") return;
    if (location.pathname.startsWith("/habits/new")) return;
    if (location.pathname.startsWith("/habits/edit/")) return;

    const activeHabits = state.habits.filter((habit) => habit.status === "active");
    if (activeHabits.length === 0) return;

    const today = dateKeyLocal(new Date());
    const lastReflectionDate = state.reflections
      .map((item) => item.date)
      .sort()
      .at(-1);

    if (lastReflectionDate) {
      if (dayDiff(lastReflectionDate, today) >= 7) {
        navigate("/reflection");
      }
      return;
    }

    const firstHabitDate = activeHabits
      .map((habit) => dateKeyLocal(new Date(habit.createdAt)))
      .sort()
      .at(0);

    if (firstHabitDate && dayDiff(firstHabitDate, today) >= 7) {
      navigate("/reflection");
    }
  }, [location.pathname, navigate, state.habits, state.reflections, state.user.onboardingComplete]);

  if (!state.user.onboardingComplete) {
    return (
      <OnboardingScreen onFinish={() => dispatch({ type: "set_onboarding_complete", payload: true })} />
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-zinc-900">
      <ReminderManager />
      <main className={["mx-auto w-full px-5 pt-8 sm:px-8", isWizardRoute ? "max-w-3xl pb-8" : "max-w-2xl pb-28"].join(" ")}>
        <Routes>
          <Route path="/today" element={<TodayScreen />} />
          <Route path="/habits" element={<HabitsScreen />} />
          <Route path="/habits/new" element={<HabitCreationWizard />} />
          <Route path="/habits/new-break" element={<BreakHabitWizard />} />
          <Route path="/habits/edit/:habitId" element={<HabitEditScreen />} />
          <Route path="/progress" element={<ProgressScreen />} />
          <Route path="/reflection" element={<WeeklyReflectionScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Routes>
      </main>
      {!isWizardRoute && <BottomTabs />}
    </div>
  );
}
