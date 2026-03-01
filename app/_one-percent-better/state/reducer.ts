import { AppState, Habit, Identity, Reflection, ScorecardBehavior } from "./types";

const createId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

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

function normalizeIdentities(identityNames: string[], existing: Identity[], habits: Habit[]): Identity[] {
  const uniqueNames = Array.from(
    new Set(
      [...identityNames, ...habits.map((habit) => habit.identity)]
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );

  const byName = new Map(existing.map((item) => [item.name, item]));
  return uniqueNames.map((name) => {
    const match = byName.get(name);
    const totalVotes = habits
      .filter((habit) => habit.identity === name)
      .reduce((sum, habit) => sum + habit.completedDates.length, 0);
    if (match) {
      return {
        ...match,
        totalVotes,
      };
    }
    const defaults = defaultIdentityMeta(name);
    return {
      id: createId(),
      name,
      description: defaults.description,
      icon: defaults.icon,
      totalVotes,
      isCustom: true,
    };
  });
}

export type AppAction =
  | { type: "set_user_name"; payload: string }
  | { type: "set_identities"; payload: string[] }
  | { type: "add_identity"; payload: string }
  | { type: "remove_identity"; payload: string }
  | { type: "set_onboarding_complete"; payload: boolean }
  | { type: "upsert_habit"; payload: Habit }
  | { type: "remove_habit"; payload: string }
  | { type: "set_reflections"; payload: Reflection[] }
  | { type: "set_scorecard"; payload: ScorecardBehavior[] }
  | { type: "replace_state"; payload: AppState };

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "set_user_name":
      return {
        ...state,
        user: {
          ...state.user,
          name: action.payload,
        },
      };

    case "add_identity": {
      const nextIdentity = action.payload.trim();
      if (!nextIdentity || state.user.identities.includes(nextIdentity)) {
        return state;
      }
      return {
        ...state,
        user: {
          ...state.user,
          identities: [...state.user.identities, nextIdentity],
        },
        identities: normalizeIdentities([...state.user.identities, nextIdentity], state.identities, state.habits),
      };
    }

    case "set_identities":
      return {
        ...state,
        user: {
          ...state.user,
          identities: action.payload,
        },
        identities: normalizeIdentities(action.payload, state.identities, state.habits),
      };

    case "remove_identity":
      return {
        ...state,
        user: {
          ...state.user,
          identities: state.user.identities.filter((item) => item !== action.payload),
        },
        identities: normalizeIdentities(
          state.user.identities.filter((item) => item !== action.payload),
          state.identities,
          state.habits,
        ),
      };

    case "set_onboarding_complete":
      return {
        ...state,
        user: {
          ...state.user,
          onboardingComplete: action.payload,
        },
      };

    case "upsert_habit": {
      const existingIndex = state.habits.findIndex((habit) => habit.id === action.payload.id);
      if (existingIndex === -1) {
        const nextHabits = [...state.habits, action.payload];
        return {
          ...state,
          habits: nextHabits,
          identities: normalizeIdentities(state.user.identities, state.identities, nextHabits),
        };
      }

      const updatedHabits = [...state.habits];
      updatedHabits[existingIndex] = action.payload;
      return {
        ...state,
        habits: updatedHabits,
        identities: normalizeIdentities(state.user.identities, state.identities, updatedHabits),
      };
    }

    case "remove_habit": {
      const nextHabits = state.habits.filter((habit) => habit.id !== action.payload);
      return {
        ...state,
        habits: nextHabits,
        identities: normalizeIdentities(state.user.identities, state.identities, nextHabits),
      };
    }

    case "set_reflections":
      return {
        ...state,
        reflections: action.payload,
      };

    case "set_scorecard":
      return {
        ...state,
        scorecard: {
          behaviors: action.payload,
          completedAt: action.payload.length > 0 ? new Date().toISOString() : state.scorecard.completedAt,
        },
      };

    case "replace_state":
      return action.payload;

    default:
      return state;
  }
}
