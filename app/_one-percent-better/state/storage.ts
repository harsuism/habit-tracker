import { initialState } from "./initialState";
import {
  AppState,
  Habit,
  HabitStatus,
  HabitType,
  Identity,
  Reflection,
  ReflectionDecision,
  ScorecardBehavior,
  ScoreRating,
} from "./types";

const STORAGE_KEY = "one-percent-better-store-v1";

const createId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

type AnyObj = Record<string, unknown>;

function asObject(value: unknown): AnyObj | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as AnyObj;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toDateOnly(value: string): string {
  return value.includes("T") ? value.split("T")[0] : value;
}

function uniqueSortedDates(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => toDateOnly(value)).filter(Boolean))).sort();
}

function toHabitType(value: unknown): HabitType {
  return value === "break" ? "break" : "build";
}

function toHabitStatus(value: unknown): HabitStatus {
  if (value === "paused" || value === "mastered") return value;
  return "active";
}

function toRating(value: unknown): ScoreRating {
  if (value === "+" || value === "-" || value === "=") return value;
  return "=";
}

function toReflectionDecision(value: unknown): ReflectionDecision {
  if (value === "keep" || value === "adjust" || value === "master") return value;
  return "keep";
}

function defaultIdentityMeta(name: string) {
  const label = name.toLowerCase();
  if (label.includes("learn")) return { icon: "📖", description: "Someone who grows through consistent study and curiosity" };
  if (label.includes("body") || label.includes("fit")) return { icon: "🏃", description: "Someone who takes care of their body daily" };
  if (label.includes("creat") || label.includes("write")) return { icon: "✍️", description: "Someone who creates with consistency" };
  if (label.includes("calm") || label.includes("focus")) return { icon: "🧘", description: "Someone calm, focused, and intentional" };
  if (label.includes("profession")) return { icon: "💼", description: "Someone reliable and professional in their commitments" };
  if (label.includes("relationship")) return { icon: "🤝", description: "Someone who builds deep, meaningful relationships" };
  if (label.includes("finance") || label.includes("money")) return { icon: "📊", description: "Someone financially wise and thoughtful" };
  if (label.includes("integrity")) return { icon: "⚡", description: "Someone with integrity and follow-through" };
  return { icon: "✨", description: "A custom identity chosen with intention" };
}

function normalizeHabit(raw: unknown): Habit {
  const obj = asObject(raw) ?? {};
  const completedDates = uniqueSortedDates(asArray(obj.completedDates).map((item) => asString(item)).filter(Boolean));
  const missedDates = uniqueSortedDates(asArray(obj.missedDates).map((item) => asString(item)).filter(Boolean));

  const levelUpHistory = asArray(obj.levelUpHistory)
    .map((entry) => asObject(entry))
    .filter((entry): entry is AnyObj => Boolean(entry))
    .map((entry) => ({
      date: asString(entry.date, new Date().toISOString()),
      from: asString(entry.from),
      to: asString(entry.to),
    }));

  const archivedAt = asString(obj.archivedAt) || undefined;
  const masteredAt = asString(obj.masteredAt) || archivedAt || null;

  const streak = asNumber(obj.streak, 0);
  const longestStreak = asNumber(obj.longestStreak, streak);

  const breakPlanRaw = asObject(obj.breakPlan);

  return {
    id: asString(obj.id, createId()),
    identity: asString(obj.identity),
    action: asString(obj.action),
    twoMinuteVersion: asString(obj.twoMinuteVersion),
    time: asString(obj.time),
    location: asString(obj.location),
    anchorHabit: asString(obj.anchorHabit) || null,
    environmentNote: asString(obj.environmentNote) || null,
    type: toHabitType(obj.type),
    status: toHabitStatus(obj.status),
    streak,
    longestStreak,
    completedDates,
    missedDates,
    createdAt: asString(obj.createdAt, new Date().toISOString()),
    levelUpHistory,
    masteredAt,
    archivedAt,
    nextLevelUpAt: asNumber(obj.nextLevelUpAt, 30),
    levelUpSnoozeUntil: asString(obj.levelUpSnoozeUntil) || undefined,
    slipDates: uniqueSortedDates(asArray(obj.slipDates).map((item) => asString(item)).filter(Boolean)),
    breakPlan: breakPlanRaw
      ? {
          trigger: asString(breakPlanRaw.trigger),
          invisibleStrategy: asString(breakPlanRaw.invisibleStrategy),
          reframe: asString(breakPlanRaw.reframe),
          frictionStrategy: asString(breakPlanRaw.frictionStrategy),
          accountabilityMethods: asArray(breakPlanRaw.accountabilityMethods).filter(
            (item): item is "partner" | "contract" | "penalty" | "public" =>
              item === "partner" || item === "contract" || item === "penalty" || item === "public",
          ),
          partnerName: asString(breakPlanRaw.partnerName) || undefined,
          contractText: asString(breakPlanRaw.contractText) || undefined,
          selfPenalty: asString(breakPlanRaw.selfPenalty) || undefined,
          trackPublicly: asBoolean(breakPlanRaw.trackPublicly),
        }
      : undefined,
  };
}

function normalizeScorecard(raw: unknown): AppState["scorecard"] {
  const obj = asObject(raw);

  if (obj && Array.isArray(obj.behaviors)) {
    const behaviors: ScorecardBehavior[] = obj.behaviors
      .map((item) => asObject(item))
      .filter((item): item is AnyObj => Boolean(item))
      .map((item) => ({
        id: asString(item.id, createId()),
        text: asString(item.text) || asString(item.behavior),
        rating: toRating(item.rating),
      }));

    return {
      behaviors,
      completedAt: asString(obj.completedAt) || null,
    };
  }

  if (Array.isArray(raw)) {
    const behaviors: ScorecardBehavior[] = raw
      .map((item) => asObject(item))
      .filter((item): item is AnyObj => Boolean(item))
      .map((item) => ({
        id: asString(item.id, createId()),
        text: asString(item.text) || asString(item.behavior),
        rating: toRating(item.rating),
      }));

    return {
      behaviors,
      completedAt: behaviors.length ? new Date().toISOString() : null,
    };
  }

  return initialState.scorecard;
}

function normalizeReflections(raw: unknown): Reflection[] {
  return asArray(raw)
    .map((item) => asObject(item))
    .filter((item): item is AnyObj => Boolean(item))
    .map((item) => ({
      id: asString(item.id, createId()),
      date: asString(item.date, new Date().toISOString()),
      habitId: asString(item.habitId),
      confidence: asNumber(item.confidence, 7),
      decision: toReflectionDecision(item.decision ?? (item.keepGoing === false ? "master" : "keep")),
      note: asString(item.note) || null,
    }));
}

function normalizeIdentities(habits: Habit[], selectedNames: string[], rawExisting: unknown): Identity[] {
  const existing = asArray(rawExisting)
    .map((item) => asObject(item))
    .filter((item): item is AnyObj => Boolean(item));

  const byName = new Map(existing.map((item) => [asString(item.name), item]));

  const names = Array.from(
    new Set([...selectedNames, ...habits.map((habit) => habit.identity)].map((item) => item.trim()).filter(Boolean)),
  );

  return names.map((name) => {
    const votes = habits
      .filter((habit) => habit.identity === name)
      .reduce((sum, habit) => sum + habit.completedDates.length, 0);

    const match = byName.get(name);
    if (match) {
      const defaults = defaultIdentityMeta(name);
      return {
        id: asString(match.id, createId()),
        name,
        description: asString(match.description, defaults.description),
        icon: asString(match.icon, defaults.icon),
        totalVotes: votes,
        isCustom: asBoolean(match.isCustom, true),
      };
    }

    const defaults = defaultIdentityMeta(name);
    return {
      id: createId(),
      name,
      description: defaults.description,
      icon: defaults.icon,
      totalVotes: votes,
      isCustom: true,
    };
  });
}

export function loadState(): AppState {
  if (typeof window === "undefined") {
    return initialState;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return initialState;
  }

  try {
    const parsed = asObject(JSON.parse(raw)) ?? {};
    const userRaw = asObject(parsed.user) ?? {};

    const habits = asArray(parsed.habits).map((habit) => normalizeHabit(habit));
    const selectedIdentityNames = asArray(userRaw.identities)
      .map((item) => asString(item))
      .filter(Boolean);

    return {
      user: {
        name: asString(userRaw.name, initialState.user.name),
        identities: selectedIdentityNames,
        onboardingComplete: asBoolean(userRaw.onboardingComplete, initialState.user.onboardingComplete),
      },
      identities: normalizeIdentities(habits, selectedIdentityNames, parsed.identities),
      habits,
      reflections: normalizeReflections(parsed.reflections),
      scorecard: normalizeScorecard(parsed.scorecard),
    };
  } catch {
    return initialState;
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
