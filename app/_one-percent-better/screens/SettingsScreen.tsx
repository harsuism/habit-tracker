"use client";

import { Button, Input, Switch } from "@heroui/react";
import { FormEvent, useState } from "react";
import { useAppState } from "../state/context";

export function SettingsScreen() {
  const { state, dispatch } = useAppState();
  const [identityInput, setIdentityInput] = useState("");

  const handleAddIdentity = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!identityInput.trim()) return;
    dispatch({ type: "add_identity", payload: identityInput.trim() });
    setIdentityInput("");
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">settings</p>
        <h2 className="font-[family-name:var(--font-instrument-serif)] text-4xl text-zinc-900">profile</h2>
      </header>

      <article className="space-y-4 rounded-2xl border border-zinc-200 bg-[#fffdf9] p-5">
        <Input
          label="name"
          labelPlacement="outside"
          value={state.user.name}
          onValueChange={(value) => dispatch({ type: "set_user_name", payload: value })}
          variant="bordered"
        />
        <Switch
          isSelected={state.user.onboardingComplete}
          onValueChange={(value) => dispatch({ type: "set_onboarding_complete", payload: value })}
        >
          onboarding complete
        </Switch>
      </article>

      <article className="space-y-4 rounded-2xl border border-zinc-200 bg-[#fffdf9] p-5">
        <h3 className="font-[family-name:var(--font-instrument-serif)] text-2xl text-zinc-900">identities</h3>
        <form onSubmit={handleAddIdentity} className="flex gap-2">
          <Input
            aria-label="add identity"
            placeholder="i am the kind of person who..."
            value={identityInput}
            onValueChange={setIdentityInput}
            variant="bordered"
          />
          <Button type="submit" color="primary">
            add
          </Button>
        </form>
        <ul className="space-y-2">
          {state.user.identities.length === 0 && <li className="text-zinc-500">no identity statements yet.</li>}
          {state.user.identities.map((identity) => (
            <li key={identity} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3">
              <span className="text-zinc-800">{identity}</span>
              <Button size="sm" variant="light" onPress={() => dispatch({ type: "remove_identity", payload: identity })}>
                remove
              </Button>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
