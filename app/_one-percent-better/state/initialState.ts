import { AppState } from "./types";

export const initialState: AppState = {
  user: {
    name: "you",
    identities: [],
    onboardingComplete: false,
  },
  identities: [],
  habits: [],
  reflections: [],
  scorecard: {
    behaviors: [],
    completedAt: null,
  },
};
