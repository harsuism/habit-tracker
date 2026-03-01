"use client";

import { MemoryRouter } from "react-router-dom";
import { AppShell } from "./AppShell";
import { AppStateProvider } from "./state/context";

export function OnePercentBetterApp() {
  return (
    <AppStateProvider>
      <MemoryRouter initialEntries={["/today"]}>
        <AppShell />
      </MemoryRouter>
    </AppStateProvider>
  );
}
