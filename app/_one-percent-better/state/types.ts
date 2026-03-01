export type HabitStatus = "active" | "paused" | "mastered";
export type HabitType = "build" | "break";
export type ScoreRating = "+" | "-" | "=";
export type AccountabilityMethod = "partner" | "contract" | "penalty" | "public";
export type ReflectionDecision = "keep" | "adjust" | "master";

export type LevelUpHistoryEntry = {
  date: string;
  from: string;
  to: string;
};

export type Identity = {
  id: string;
  name: string;
  description: string;
  icon: string;
  totalVotes: number;
  isCustom: boolean;
};

export type User = {
  name: string;
  identities: string[];
  onboardingComplete: boolean;
};

export type Habit = {
  id: string;
  identity: string; // linked identity name
  action: string; // full habit description
  twoMinuteVersion: string;
  time: string; // HH:MM
  location: string;
  anchorHabit: string | null;
  environmentNote: string | null;
  type: HabitType;
  status: HabitStatus;
  streak: number;
  longestStreak: number;
  completedDates: string[];
  missedDates: string[];
  createdAt: string;
  levelUpHistory: LevelUpHistoryEntry[];
  masteredAt: string | null;

  // Existing compatibility fields used by current UI flows.
  archivedAt?: string;
  nextLevelUpAt?: number;
  levelUpSnoozeUntil?: string;
  slipDates?: string[];
  breakPlan?: {
    trigger: string;
    invisibleStrategy: string;
    reframe: string;
    frictionStrategy: string;
    accountabilityMethods: AccountabilityMethod[];
    partnerName?: string;
    contractText?: string;
    selfPenalty?: string;
    trackPublicly?: boolean;
  };
};

export type Reflection = {
  id: string;
  date: string;
  habitId: string;
  confidence: number; // 1-10
  decision: ReflectionDecision;
  note: string | null;
};

export type ScorecardBehavior = {
  id: string;
  text: string;
  rating: ScoreRating;
};

export type Scorecard = {
  behaviors: ScorecardBehavior[];
  completedAt: string | null;
};

export type AppState = {
  user: User;
  identities: Identity[];
  habits: Habit[];
  reflections: Reflection[];
  scorecard: Scorecard;
};
