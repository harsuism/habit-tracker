"use client";

import { Button, Checkbox, Input, Switch, Textarea } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../state/context";
import { AccountabilityMethod } from "../state/types";

const createId = () => Math.random().toString(36).slice(2, 10);

const stepTitles = [
  "the conflict",
  "make it invisible",
  "make it unattractive",
  "make it difficult",
  "make it unsatisfying",
  "inversion plan",
];

const invisibleSuggestions = [
  "Delete the app",
  "Put phone in another room",
  "Block the website",
  "Remove it from sight",
  "Change your route",
];

const frictionSuggestions = [
  "Add a screen time limit",
  "Log out every time",
  "Require a password",
  "Use website blocker",
  "Add a 10-second pause before starting",
];

const transitionVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 48 : -48 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -48 : 48 }),
};

type BreakForm = {
  badHabit: string;
  identity: string;
  trigger: string;
  invisibleStrategy: string;
  reframe: string;
  frictionStrategy: string;
  accountabilityMethods: AccountabilityMethod[];
  partnerName: string;
  selfPenalty: string;
  trackPublicly: boolean;
};

export function BreakHabitWizard() {
  const navigate = useNavigate();
  const { state, dispatch } = useAppState();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<BreakForm>({
    badHabit: "",
    identity: state.user.identities[0] ?? "",
    trigger: "",
    invisibleStrategy: "",
    reframe: "",
    frictionStrategy: "",
    accountabilityMethods: [],
    partnerName: "",
    selfPenalty: "",
    trackPublicly: false,
  });

  const contractText = useMemo(
    () =>
      `I am committed to protecting ${form.identity || "my identity"} by reducing ${
        form.badHabit || "this habit"
      }. If I slip, I will reset with intention and continue immediately.`,
    [form.identity, form.badHabit],
  );

  const reframeStatement = useMemo(
    () =>
      `When I ${form.badHabit || "[bad habit]"}, I'm choosing ${
        form.reframe || "[cost]"
      } over ${form.identity || "[identity]"}.`,
    [form.badHabit, form.reframe, form.identity],
  );

  const accountabilitySummary = useMemo(() => {
    if (form.accountabilityMethods.length === 0) return "none selected";

    const labels = form.accountabilityMethods.map((method) => {
      if (method === "partner") return form.partnerName ? `partner: ${form.partnerName}` : "partner";
      if (method === "contract") return "habit contract";
      if (method === "penalty") return form.selfPenalty ? `penalty: ${form.selfPenalty}` : "self-penalty";
      return form.trackPublicly ? "track publicly: on" : "track publicly";
    });

    return labels.join(" · ");
  }, [form.accountabilityMethods, form.partnerName, form.selfPenalty, form.trackPublicly]);

  const setField = <K extends keyof BreakForm>(key: K, value: BreakForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleMethod = (method: AccountabilityMethod) => {
    setForm((current) => {
      const selected = current.accountabilityMethods.includes(method);
      return {
        ...current,
        accountabilityMethods: selected
          ? current.accountabilityMethods.filter((item) => item !== method)
          : [...current.accountabilityMethods, method],
      };
    });
  };

  const nextDisabled = useMemo(() => {
    if (step === 0) return !form.badHabit.trim() || !form.identity;
    if (step === 1) return !form.trigger.trim() || !form.invisibleStrategy.trim();
    if (step === 2) return !form.reframe.trim();
    if (step === 3) return !form.frictionStrategy.trim();
    if (step === 4) return false;
    return false;
  }, [form, step]);

  const goBack = () => {
    if (step === 0) {
      navigate("/habits");
      return;
    }
    setDirection(-1);
    setStep((current) => current - 1);
  };

  const goNext = () => {
    if (step >= 5 || nextDisabled) return;
    setDirection(1);
    setStep((current) => current + 1);
  };

  const commitPlan = () => {
    dispatch({
      type: "upsert_habit",
      payload: {
        id: createId(),
        identity: form.identity,
        action: form.badHabit.trim(),
        twoMinuteVersion: `Avoid ${form.badHabit.trim()}`,
        time: "",
        location: "",
        anchorHabit: null,
        environmentNote: form.frictionStrategy.trim() || null,
        streak: 0,
        longestStreak: 0,
        completedDates: [],
        missedDates: [],
        createdAt: new Date().toISOString(),
        levelUpHistory: [],
        masteredAt: null,
        status: "active",
        type: "break",
        slipDates: [],
        breakPlan: {
          trigger: form.trigger.trim(),
          invisibleStrategy: form.invisibleStrategy.trim(),
          reframe: form.reframe.trim(),
          frictionStrategy: form.frictionStrategy.trim(),
          accountabilityMethods: form.accountabilityMethods,
          partnerName: form.partnerName.trim() || undefined,
          contractText: form.accountabilityMethods.includes("contract") ? contractText : undefined,
          selfPenalty: form.selfPenalty.trim() || undefined,
          trackPublicly: form.trackPublicly,
        },
      },
    });

    navigate("/today");
  };

  return (
    <section className="mx-auto w-full max-w-3xl space-y-8 pb-20">
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm uppercase tracking-[0.16em] text-zinc-500">break a habit</p>
          <p className="text-sm text-zinc-500">step {step + 1} of 6</p>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {stepTitles.map((title, index) => (
            <div key={title} className="space-y-2">
              <div className={["h-1.5 rounded-full", index <= step ? "bg-amber-500" : "bg-zinc-200"].join(" ")} />
              <p className="hidden text-[11px] text-zinc-400 md:block">{title}</p>
            </div>
          ))}
        </div>
      </header>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.article
          key={step}
          custom={direction}
          variants={transitionVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="space-y-6"
        >
          {step === 0 && (
            <div className="space-y-5">
              <h1 className="font-[family-name:var(--font-instrument-serif)] text-4xl text-zinc-900 sm:text-5xl">
                What habit is working against you?
              </h1>
              <Input
                label="the bad habit"
                labelPlacement="outside"
                placeholder="Scrolling social media during work"
                value={form.badHabit}
                onValueChange={(value) => setField("badHabit", value)}
                variant="bordered"
              />

              <div className="space-y-3">
                <p className="text-zinc-700">Which identity does this conflict with?</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {state.user.identities.map((identity) => {
                    const selected = form.identity === identity;
                    return (
                      <button
                        key={identity}
                        type="button"
                        onClick={() => setField("identity", identity)}
                        className={[
                          "rounded-2xl p-4 text-left transition",
                          selected
                            ? "border border-amber-400 bg-amber-50/50 ring-1 ring-amber-300/70"
                            : "border border-zinc-200 bg-[#fffdf9]",
                        ].join(" ")}
                      >
                        {identity}
                      </button>
                    );
                  })}
                </div>
              </div>

              {form.badHabit && form.identity && (
                <p className="rounded-2xl bg-amber-50/60 p-4 text-zinc-700">
                  every time you do {form.badHabit}, you cast a vote against becoming {form.identity}.
                </p>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h1 className="font-[family-name:var(--font-instrument-serif)] text-4xl text-zinc-900 sm:text-5xl">
                Remove the cue
              </h1>
              <Textarea
                label="what triggers this habit? what do you see, hear, or feel right before you do it?"
                labelPlacement="outside"
                minRows={3}
                value={form.trigger}
                onValueChange={(value) => setField("trigger", value)}
                variant="bordered"
              />
              <Textarea
                label="how can you remove or hide this trigger?"
                labelPlacement="outside"
                minRows={3}
                value={form.invisibleStrategy}
                onValueChange={(value) => setField("invisibleStrategy", value)}
                variant="bordered"
              />
              <div className="flex flex-wrap gap-2">
                {invisibleSuggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setField("invisibleStrategy", item)}
                    className="rounded-full bg-zinc-100 px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-200"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h1 className="font-[family-name:var(--font-instrument-serif)] text-4xl text-zinc-900 sm:text-5xl">
                Reframe the cost
              </h1>
              <Textarea
                label="what is this habit really costing you?"
                labelPlacement="outside"
                minRows={5}
                value={form.reframe}
                onValueChange={(value) => setField("reframe", value)}
                variant="bordered"
              />
              <p className="text-sm text-zinc-500">
                think about what you lose each time: time, energy, focus, self-respect, progress toward {form.identity || "your identity"}.
              </p>
              <div className="rounded-2xl bg-[#fffdf9] p-4 text-zinc-700">{reframeStatement}</div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h1 className="font-[family-name:var(--font-instrument-serif)] text-4xl text-zinc-900 sm:text-5xl">
                Add friction
              </h1>
              <Textarea
                label="make it harder to do. what steps or barriers can you add?"
                labelPlacement="outside"
                minRows={4}
                value={form.frictionStrategy}
                onValueChange={(value) => setField("frictionStrategy", value)}
                variant="bordered"
              />
              <div className="flex flex-wrap gap-2">
                {frictionSuggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setField("frictionStrategy", item)}
                    className="rounded-full bg-zinc-100 px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-200"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <h1 className="font-[family-name:var(--font-instrument-serif)] text-4xl text-zinc-900 sm:text-5xl">
                Add accountability
              </h1>

              <div className="space-y-4 rounded-2xl bg-[#fffdf9] p-5">
                <Checkbox isSelected={form.accountabilityMethods.includes("partner")} onValueChange={() => toggleMethod("partner")}>Set an accountability partner</Checkbox>
                {form.accountabilityMethods.includes("partner") && (
                  <Input
                    placeholder="their name"
                    value={form.partnerName}
                    onValueChange={(value) => setField("partnerName", value)}
                    variant="bordered"
                  />
                )}
              </div>

              <div className="space-y-4 rounded-2xl bg-[#fffdf9] p-5">
                <Checkbox isSelected={form.accountabilityMethods.includes("contract")} onValueChange={() => toggleMethod("contract")}>
                  Write a habit contract
                </Checkbox>
                {form.accountabilityMethods.includes("contract") && (
                  <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700">{contractText}</div>
                )}
              </div>

              <div className="space-y-4 rounded-2xl bg-[#fffdf9] p-5">
                <Checkbox isSelected={form.accountabilityMethods.includes("penalty")} onValueChange={() => toggleMethod("penalty")}>Add a self-penalty</Checkbox>
                {form.accountabilityMethods.includes("penalty") && (
                  <Input
                    placeholder="Donate $5 to charity"
                    value={form.selfPenalty}
                    onValueChange={(value) => setField("selfPenalty", value)}
                    variant="bordered"
                  />
                )}
              </div>

              <div className="space-y-4 rounded-2xl bg-[#fffdf9] p-5">
                <Checkbox isSelected={form.accountabilityMethods.includes("public")} onValueChange={() => toggleMethod("public")}>
                  Track publicly
                </Checkbox>
                {form.accountabilityMethods.includes("public") && (
                  <div className="flex items-center justify-between">
                    <p className="text-zinc-700">show this in shared views</p>
                    <Switch isSelected={form.trackPublicly} onValueChange={(value) => setField("trackPublicly", value)} />
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <h1 className="font-[family-name:var(--font-instrument-serif)] text-4xl text-zinc-900 sm:text-5xl">
                Your inversion plan
              </h1>

              <div className="rounded-3xl border border-zinc-200 bg-[#fffdf9] p-6 shadow-[0_10px_24px_rgba(0,0,0,0.04)]">
                <p className="text-lg text-zinc-800">🚫 Breaking: {form.badHabit || "[bad habit]"}</p>
                <p className="mt-1 text-lg text-zinc-800">⚡ To protect: {form.identity || "[identity]"}</p>

                <div className="mt-5 space-y-2 text-zinc-700">
                  <p>Trigger: {form.trigger || "-"}</p>
                  <p>Remove: {form.invisibleStrategy || "-"}</p>
                  <p>Reframe: {reframeStatement}</p>
                  <p>Friction: {form.frictionStrategy || "-"}</p>
                  <p>Accountability: {accountabilitySummary}</p>
                </div>
              </div>

              <Button radius="full" className="bg-amber-500 px-8 text-white hover:bg-amber-600" onPress={commitPlan}>
                I&apos;m committed →
              </Button>
            </div>
          )}
        </motion.article>
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <Button variant="light" onPress={goBack}>
          back
        </Button>

        {step < 5 && (
          <Button className="bg-zinc-900 px-6 text-white hover:bg-zinc-800" onPress={goNext} isDisabled={nextDisabled}>
            next
          </Button>
        )}
      </div>
    </section>
  );
}
