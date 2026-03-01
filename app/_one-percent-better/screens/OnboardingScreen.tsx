"use client";

import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAppState } from "../state/context";
import { ScoreRating } from "../state/types";

type OnboardingScreenProps = {
  onFinish: () => void;
};

const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

const behaviorPlaceholders = [
  "Check phone in bed",
  "Make coffee",
  "Commute to work",
  "Scroll Instagram",
];

type IdentityOption = {
  id: string;
  icon: string;
  label: string;
  description: string;
};

const baseIdentityOptions: IdentityOption[] = [
  {
    id: "disciplined-learner",
    icon: "📖",
    label: "A disciplined learner",
    description: "Someone who grows through consistent study and curiosity",
  },
  {
    id: "takes-care-body",
    icon: "🏃",
    label: "Someone who takes care of their body",
    description: "Someone who trains, rests well, and fuels with intention",
  },
  {
    id: "consistent-creator",
    icon: "✍️",
    label: "A consistent creator",
    description: "Someone who ships thoughtful creative work regularly",
  },
  {
    id: "calm-focused",
    icon: "🧘",
    label: "A calm, focused person",
    description: "Someone who protects attention and responds with clarity",
  },
  {
    id: "reliable-professional",
    icon: "💼",
    label: "A reliable professional",
    description: "Someone who follows through and earns trust daily",
  },
  {
    id: "deep-relationships",
    icon: "🤝",
    label: "Someone who builds deep relationships",
    description: "Someone who shows up fully and nurtures meaningful bonds",
  },
  {
    id: "financially-wise",
    icon: "📊",
    label: "A financially wise person",
    description: "Someone who spends and invests with long-term awareness",
  },
  {
    id: "integrity-follow-through",
    icon: "⚡",
    label: "A person of integrity and follow-through",
    description: "Someone whose actions consistently match their word",
  },
];

const createId = () => Math.random().toString(36).slice(2, 10);

function PhilosophyCurve() {
  return (
    <div className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-zinc-200 bg-[#fffdf8] p-4 sm:p-6">
      <svg viewBox="0 0 420 220" className="h-52 w-full">
        <line x1="30" y1="190" x2="390" y2="190" stroke="#d4d4d8" strokeWidth="1" />
        <line x1="30" y1="190" x2="30" y2="25" stroke="#d4d4d8" strokeWidth="1" />
        <motion.path
          d="M30 188 C120 186, 210 175, 290 130 C335 103, 365 66, 390 32"
          fill="none"
          stroke="#d97706"
          strokeWidth="2.2"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0.35 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.8, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}

function IdentitySelectionStep({ onContinue }: { onContinue: () => void }) {
  const { state, dispatch } = useAppState();
  const [identityOptions, setIdentityOptions] = useState<IdentityOption[]>(baseIdentityOptions);
  const [selected, setSelected] = useState<string[]>(() => state.user.identities.slice(0, 2));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customIdentity, setCustomIdentity] = useState("");

  const selectedCount = selected.length;
  const canContinue = selectedCount >= 1 && selectedCount <= 2;

  const toggleIdentity = (label: string) => {
    setSelected((current) => {
      if (current.includes(label)) {
        return current.filter((item) => item !== label);
      }
      if (current.length >= 2) {
        return current;
      }
      return [...current, label];
    });
  };

  const addCustomIdentity = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = customIdentity.trim();
    if (!value) return;
    if (identityOptions.some((item) => item.label.toLowerCase() === value.toLowerCase())) {
      setCustomIdentity("");
      setIsModalOpen(false);
      return;
    }

    const nextOption: IdentityOption = {
      id: createId(),
      icon: "✨",
      label: value,
      description: "A custom identity you chose to embody through daily action",
    };

    setIdentityOptions((current) => [...current, nextOption]);
    setSelected((current) => {
      if (current.length >= 2) return current;
      return [...current, value];
    });
    setCustomIdentity("");
    setIsModalOpen(false);
  };

  const handleContinue = () => {
    if (!canContinue) return;
    dispatch({ type: "set_identities", payload: selected });
    onContinue();
  };

  return (
    <motion.article {...pageTransition} className="flex h-full flex-col space-y-5">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-instrument-serif)] text-5xl leading-tight text-zinc-900 sm:text-6xl">
          Who do you want to become?
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-zinc-600">
          Every habit is a vote for your future identity. Choose 1-2 identities to start building toward.
        </p>
      </header>

      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">identity badges</p>
        <p className="text-sm text-zinc-600">{selectedCount}/2 selected</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <AnimatePresence>
          {identityOptions.map((item) => {
            const isSelected = selected.includes(item.label);
            return (
              <motion.button
                key={item.id}
                layout
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleIdentity(item.label)}
                className={[
                  "relative rounded-2xl bg-[#fffdf8] p-4 text-left transition",
                  "shadow-[0_3px_14px_rgba(24,24,27,0.06)]",
                  isSelected
                    ? "border border-amber-400 bg-amber-50/50 ring-1 ring-amber-300/70"
                    : "border border-zinc-200",
                ].join(" ")}
              >
                {isSelected && (
                  <motion.span
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute right-3 top-3 rounded-full bg-amber-500 px-2 py-[2px] text-xs text-white"
                  >
                    ✓
                  </motion.span>
                )}
                <p className="text-xl">{item.icon}</p>
                <p className="mt-2 text-base text-zinc-900">{item.label}</p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-500">{item.description}</p>
              </motion.button>
            );
          })}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="rounded-2xl border border-dashed border-zinc-300 bg-[#f6f3ec] p-4 text-left text-zinc-600 transition hover:bg-[#f1ece2]"
        >
          <p className="text-sm uppercase tracking-wide text-zinc-500">custom</p>
          <p className="mt-2 text-base">+ Write your own identity</p>
        </button>
      </div>

      {canContinue && (
        <div className="pt-2">
          <Button
            radius="full"
            className="bg-amber-500 px-8 text-white hover:bg-amber-600"
            onPress={handleContinue}
          >
            Build my first habit →
          </Button>
        </div>
      )}

      <Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen} placement="center">
        <ModalContent>
          <form onSubmit={addCustomIdentity}>
            <ModalHeader>I want to become...</ModalHeader>
            <ModalBody>
              <Input
                autoFocus
                value={customIdentity}
                onValueChange={setCustomIdentity}
                variant="bordered"
                placeholder="someone who..."
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={() => setIsModalOpen(false)}>
                cancel
              </Button>
              <Button type="submit" className="bg-amber-500 text-white hover:bg-amber-600">
                add identity
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </motion.article>
  );
}

function ScorecardStep({ onContinue }: { onContinue: () => void }) {
  const { state, dispatch } = useAppState();
  const [behaviorInput, setBehaviorInput] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPlaceholderIndex((current) => (current + 1) % behaviorPlaceholders.length);
    }, 1800);

    return () => window.clearInterval(timer);
  }, []);

  const totals = useMemo(() => {
    const good = state.scorecard.behaviors.filter((item) => item.rating === "+").length;
    const bad = state.scorecard.behaviors.filter((item) => item.rating === "-").length;
    const neutral = state.scorecard.behaviors.filter((item) => item.rating === "=").length;
    return { good, bad, neutral };
  }, [state.scorecard.behaviors]);

  const canContinue = state.scorecard.behaviors.length >= 5;

  const addBehavior = () => {
    const value = behaviorInput.trim();
    if (!value) return;

    dispatch({
      type: "set_scorecard",
      payload: [
        ...state.scorecard.behaviors,
        {
          id: createId(),
          text: value,
          rating: "=",
        },
      ],
    });
    setBehaviorInput("");
  };

  const handleAddSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addBehavior();
  };

  const updateRating = (id: string, rating: ScoreRating) => {
    dispatch({
      type: "set_scorecard",
      payload: state.scorecard.behaviors.map((item) => (item.id === id ? { ...item, rating } : item)),
    });
  };

  const removeBehavior = (id: string) => {
    dispatch({
      type: "set_scorecard",
      payload: state.scorecard.behaviors.filter((item) => item.id !== id),
    });
  };

  return (
    <motion.article {...pageTransition} className="flex h-full flex-col space-y-5">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-instrument-serif)] text-5xl leading-tight text-zinc-900 sm:text-6xl">
          Your Current Habits
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-zinc-600">
          List your daily routines from morning to night. Then rate each one.
        </p>
      </header>

      <form onSubmit={handleAddSubmit} className="flex gap-2 rounded-2xl bg-[#fffdf8] p-2">
        <Input
          aria-label="Add a daily behavior"
          variant="bordered"
          value={behaviorInput}
          onValueChange={setBehaviorInput}
          placeholder={behaviorPlaceholders[placeholderIndex]}
          classNames={{
            inputWrapper: "border-zinc-200 bg-white",
          }}
        />
        <Button type="submit" radius="full" className="bg-amber-500 text-white hover:bg-amber-600">
          add
        </Button>
      </form>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl bg-[#fffdf8] px-4 py-2">
        <AnimatePresence>
          {state.scorecard.behaviors.map((item, index) => (
            <motion.article
              key={item.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -70 }}
              transition={{ duration: 0.2 }}
              drag="x"
              dragConstraints={{ left: -120, right: 0 }}
              dragElastic={0.1}
              onDragEnd={(_, info) => {
                if (info.offset.x < -80) {
                  removeBehavior(item.id);
                }
              }}
              className="border-b border-zinc-200 py-4"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <span className="mt-[2px] text-sm text-zinc-400">{index + 1}.</span>
                  <p className="text-base text-zinc-800">{item.text}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeBehavior(item.id)}
                  className="text-xs text-zinc-400 hover:text-zinc-600"
                >
                  delete
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => updateRating(item.id, "+")}
                  className={[
                    "rounded-full px-4 py-2 text-sm transition active:scale-95",
                    item.rating === "+" ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-600",
                  ].join(" ")}
                >
                  [+] good
                </button>
                <button
                  type="button"
                  onClick={() => updateRating(item.id, "-")}
                  className={[
                    "rounded-full px-4 py-2 text-sm transition active:scale-95",
                    item.rating === "-" ? "bg-rose-100 text-rose-800" : "bg-zinc-100 text-zinc-600",
                  ].join(" ")}
                >
                  [–] bad
                </button>
                <button
                  type="button"
                  onClick={() => updateRating(item.id, "=")}
                  className={[
                    "rounded-full px-4 py-2 text-sm transition active:scale-95",
                    item.rating === "=" ? "bg-zinc-300 text-zinc-800" : "bg-zinc-100 text-zinc-600",
                  ].join(" ")}
                >
                  [=] neutral
                </button>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>

        {state.scorecard.behaviors.length === 0 && (
          <div className="flex h-full min-h-52 items-center justify-center text-center text-zinc-500">
            start listing your day from wake-up to bedtime.
          </div>
        )}
      </div>

      <footer className="space-y-4 rounded-2xl bg-[#fffdf8] p-4">
        <p className="text-zinc-600">
          {totals.good} good · {totals.bad} bad · {totals.neutral} neutral
        </p>

        {canContinue ? (
          <Button radius="full" className="bg-amber-500 px-8 text-white hover:bg-amber-600" onPress={onContinue}>
            I see my patterns →
          </Button>
        ) : (
          <p className="text-sm text-zinc-500">add at least 5 behaviors to continue.</p>
        )}
      </footer>
    </motion.article>
  );
}

export function OnboardingScreen({ onFinish }: OnboardingScreenProps) {
  const [page, setPage] = useState(0);

  return (
    <section className="relative flex min-h-screen flex-col bg-[#f8f4ec] px-6 pb-10 pt-14 sm:px-10">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center">
        <AnimatePresence mode="wait">
          {page === 0 && (
            <motion.article key="page-1" {...pageTransition} className="space-y-6">
              <h1 className="font-[family-name:var(--font-instrument-serif)] text-5xl leading-tight text-zinc-900 sm:text-6xl">
                Tiny changes. Remarkable results.
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-zinc-600">
                If you get 1% better each day for one year, you&apos;ll end up 37 times better.
              </p>
              <PhilosophyCurve />
            </motion.article>
          )}

          {page === 1 && <ScorecardStep key="page-2" onContinue={() => setPage(2)} />}

          {page === 2 && <IdentitySelectionStep key="page-3" onContinue={() => setPage(3)} />}

          {page === 3 && (
            <motion.article key="page-4" {...pageTransition} className="space-y-6">
              <h1 className="font-[family-name:var(--font-instrument-serif)] text-5xl leading-tight text-zinc-900 sm:text-6xl">
                You don&apos;t rise to the level of your goals. You fall to the level of your systems.
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-zinc-600">
                We&apos;ll help you build a system, one tiny habit at a time.
              </p>
              <div className="pt-3">
                <Button
                  size="lg"
                  radius="full"
                  className="bg-amber-500 px-8 font-medium text-white hover:bg-amber-600"
                  onPress={onFinish}
                >
                  Let&apos;s build your system →
                </Button>
              </div>
            </motion.article>
          )}
        </AnimatePresence>
      </div>

      <footer className="mx-auto flex w-full max-w-4xl items-center justify-between">
        <div className="flex items-center gap-2">
          {[0, 1, 2, 3].map((dot) => (
            <button
              key={dot}
              type="button"
              aria-label={`Go to page ${dot + 1}`}
              onClick={() => setPage(dot)}
              className={[
                "h-2.5 rounded-full transition-all",
                page === dot ? "w-6 bg-zinc-800" : "w-2.5 bg-zinc-300",
              ].join(" ")}
            />
          ))}
        </div>

        {page === 1 ? (
          <span className="text-sm text-zinc-500">score your day</span>
        ) : page === 2 ? (
          <span className="text-sm text-zinc-500">choose 1-2 identities</span>
        ) : page < 3 ? (
          <Button variant="light" radius="full" onPress={() => setPage((current) => Math.min(current + 1, 3))}>
            next
          </Button>
        ) : (
          <span className="text-sm text-zinc-500">page 4 of 4</span>
        )}
      </footer>
    </section>
  );
}
