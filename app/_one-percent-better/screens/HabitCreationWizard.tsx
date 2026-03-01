"use client";

import { Button, Input, Switch, Textarea } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../state/context";

const createId = () => Math.random().toString(36).slice(2, 10);

type WizardData = {
  identity: string;
  action: string;
  twoMinuteVersion: string;
  time: string;
  location: string;
  linkToExisting: boolean;
  anchorHabit: string | null;
  environmentNote: string;
};

const stepTitles = [
  "identity link",
  "the action",
  "implementation intention",
  "habit stack + environment",
  "review",
];

const environmentSuggestions = [
  "Leave what you need visible",
  "Remove distractions",
  "Prepare the night before",
  "Set out what you need",
];

const transitionVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 48 : -48 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -48 : 48 }),
};

export function HabitCreationWizard() {
  const navigate = useNavigate();
  const { state, dispatch } = useAppState();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<WizardData>({
    identity: state.user.identities[0] ?? "",
    action: "",
    twoMinuteVersion: "",
    time: "",
    location: "",
    linkToExisting: true,
    anchorHabit: null,
    environmentNote: "",
  });

  const eligibleAnchors = useMemo(
    () => state.scorecard.behaviors.filter((item) => item.rating === "+" || item.rating === "="),
    [state.scorecard.behaviors],
  );

  const assembledLine = useMemo(() => {
    const action = form.twoMinuteVersion || "[two-minute version]";
    const time = form.time || "[time]";
    const location = form.location || "[location]";
    return `I will ${action} at ${time} at ${location}`;
  }, [form.twoMinuteVersion, form.time, form.location]);

  const nextDisabled = useMemo(() => {
    if (step === 0) return !form.identity;
    if (step === 1) return !form.action.trim() || !form.twoMinuteVersion.trim();
    if (step === 2) return !form.time || !form.location.trim();
    if (step === 3) return form.linkToExisting && !form.anchorHabit;
    return false;
  }, [form, step]);

  const goNext = () => {
    if (step >= 4 || nextDisabled) return;
    setDirection(1);
    setStep((current) => current + 1);
  };

  const goBack = () => {
    if (step === 0) {
      navigate("/habits");
      return;
    }
    setDirection(-1);
    setStep((current) => current - 1);
  };

  const saveHabit = () => {
    dispatch({
      type: "upsert_habit",
      payload: {
        id: createId(),
        identity: form.identity,
        action: form.action.trim(),
        twoMinuteVersion: form.twoMinuteVersion.trim(),
        time: form.time,
        location: form.location.trim(),
        anchorHabit: form.linkToExisting ? form.anchorHabit : null,
        environmentNote: form.environmentNote.trim() || null,
        streak: 0,
        longestStreak: 0,
        completedDates: [],
        missedDates: [],
        createdAt: new Date().toISOString(),
        levelUpHistory: [],
        masteredAt: null,
        status: "active",
        type: "build",
        nextLevelUpAt: 30,
      },
    });

    navigate("/today");
  };

  return (
    <section className="mx-auto w-full max-w-3xl space-y-8 pb-20">
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm uppercase tracking-[0.16em] text-zinc-500">new habit</p>
          <p className="text-sm text-zinc-500">step {step + 1} of 5</p>
        </div>

        <div className="grid grid-cols-5 gap-2">
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
                Which identity does this serve?
              </h1>
              <div className="grid gap-3 sm:grid-cols-2">
                {state.user.identities.map((identity) => {
                  const selected = form.identity === identity;
                  return (
                    <button
                      key={identity}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, identity }))}
                      className={[
                        "rounded-2xl p-4 text-left transition",
                        selected
                          ? "border border-amber-400 bg-amber-50/50 ring-1 ring-amber-300/70"
                          : "border border-zinc-200 bg-[#fffdf9]",
                      ].join(" ")}
                    >
                      <p className="text-zinc-900">{identity}</p>
                    </button>
                  );
                })}
                {state.user.identities.length === 0 && (
                  <p className="rounded-2xl border border-zinc-200 bg-[#fffdf9] p-4 text-zinc-500 sm:col-span-2">
                    no identities found yet. set one in onboarding/settings first.
                  </p>
                )}
              </div>
              {form.identity && (
                <p className="rounded-2xl bg-amber-50/60 p-4 text-zinc-700">
                  every time you do this habit, you cast a vote for becoming <span className="font-medium">{form.identity}</span>.
                </p>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-0">
              <h1 className="font-[family-name:var(--font-instrument-serif)] text-4xl text-zinc-900 sm:text-5xl">
                What&apos;s the habit?
              </h1>
              <div className="mt-8">
                <Input
                  label="i will..."
                  labelPlacement="outside"
                  placeholder="Read, meditate, write, exercise"
                  value={form.action}
                  onValueChange={(value) => setForm((current) => ({ ...current, action: value }))}
                  variant="bordered"
                />
              </div>

              <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/50 p-6">
                <p className="text-sm uppercase tracking-[0.16em] text-amber-700">the two-minute rule</p>
                <p className="mt-2 text-zinc-700">
                  scale it down. what&apos;s the smallest version that takes 2 minutes or less?
                </p>
              </div>

              <div className="mt-8">
                <Input
                  label="my two-minute version"
                  labelPlacement="outside"
                  placeholder="Read one page"
                  value={form.twoMinuteVersion}
                  onValueChange={(value) => setForm((current) => ({ ...current, twoMinuteVersion: value }))}
                  variant="bordered"
                />
              </div>

              <p className="mt-5 text-sm text-zinc-500">
                we&apos;ll track this version. you can always do more, but this is your minimum.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h1 className="font-[family-name:var(--font-instrument-serif)] text-4xl text-zinc-900 sm:text-5xl">
                When and where?
              </h1>
              <Input
                type="time"
                label="i will do this at"
                labelPlacement="outside"
                value={form.time}
                onValueChange={(value) => setForm((current) => ({ ...current, time: value }))}
                variant="bordered"
              />
              <Input
                label="in/at"
                labelPlacement="outside"
                placeholder="At my desk"
                value={form.location}
                onValueChange={(value) => setForm((current) => ({ ...current, location: value }))}
                variant="bordered"
              />

              <AnimatePresence mode="wait">
                <motion.div
                  key={assembledLine}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-2xl bg-[#fffdf9] p-4 text-zinc-700"
                >
                  {assembledLine}
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h1 className="font-[family-name:var(--font-instrument-serif)] text-4xl text-zinc-900 sm:text-5xl">
                Anchor it to your routine
              </h1>

              <div className="space-y-4 rounded-2xl bg-[#fffdf9] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-zinc-800">link to an existing habit?</p>
                  <Switch
                    isSelected={form.linkToExisting}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, linkToExisting: value, anchorHabit: value ? current.anchorHabit : null }))
                    }
                  />
                </div>

                {form.linkToExisting && (
                  <div className="space-y-3">
                    <p className="text-sm text-zinc-500">after i...</p>
                    <select
                      value={form.anchorHabit ?? ""}
                      onChange={(event) => setForm((current) => ({ ...current, anchorHabit: event.target.value || null }))}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-800"
                    >
                      <option value="">select an existing routine</option>
                      {eligibleAnchors.map((item) => (
                        <option key={item.id} value={item.text}>
                          {item.text}
                        </option>
                      ))}
                    </select>
                    {eligibleAnchors.length === 0 && (
                      <p className="text-sm text-zinc-500">add some + or = scorecard items first to use habit stacking.</p>
                    )}
                    {form.anchorHabit && (
                      <p className="text-sm text-zinc-700">
                        after i <span className="font-medium">{form.anchorHabit}</span>, i will{" "}
                        <span className="font-medium">{form.twoMinuteVersion || "[habit]"}</span>.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4 rounded-2xl bg-[#fffdf9] p-5">
                <p className="text-zinc-800">how will you set up your space to make this easier?</p>
                <Textarea
                  placeholder="Leave my book on the pillow"
                  value={form.environmentNote}
                  onValueChange={(value) => setForm((current) => ({ ...current, environmentNote: value }))}
                  minRows={3}
                  variant="bordered"
                />
                <div className="flex flex-wrap gap-2">
                  {environmentSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, environmentNote: suggestion }))}
                      className="rounded-full bg-zinc-100 px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-200"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h1 className="font-[family-name:var(--font-instrument-serif)] text-4xl text-zinc-900 sm:text-5xl">
                Your new system
              </h1>

              <div className="rounded-3xl border border-zinc-200 bg-[#fffdf9] p-6 shadow-[0_10px_24px_rgba(0,0,0,0.04)]">
                <p className="text-lg text-zinc-800">🎯 {form.identity || "[identity]"}</p>
                <p className="mt-5 whitespace-pre-line text-zinc-700">
                  {`"I will ${form.twoMinuteVersion || "[two-minute action]"}
at ${form.time || "[time]"} at ${form.location || "[location]"}
so that I can become
${form.identity || "[identity]"}."`}
                </p>
                <div className="mt-6 space-y-2 text-zinc-600">
                  <p>Anchor: {form.anchorHabit ? `After ${form.anchorHabit}` : "None"}</p>
                  <p>Environment: {form.environmentNote || "None"}</p>
                </div>
              </div>

              <Button radius="full" className="bg-amber-500 px-8 text-white hover:bg-amber-600" onPress={saveHabit}>
                Start this habit →
              </Button>
            </div>
          )}
        </motion.article>
      </AnimatePresence>

      <div className={["flex items-center justify-between", step === 1 ? "mt-14" : ""].join(" ")}>
        <Button variant="light" onPress={goBack}>
          back
        </Button>

        {step < 4 && (
          <Button className="bg-zinc-900 px-6 text-white hover:bg-zinc-800" onPress={goNext} isDisabled={nextDisabled}>
            next
          </Button>
        )}
      </div>
    </section>
  );
}
