"use client";

import { Button, Input } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Habit } from "../state/types";

type LevelUpPromptProps = {
  habit: Habit | null;
  onLevelUp: (nextTwoMinute: string) => void;
  onKeepCurrent: () => void;
  onMastered: () => void;
  onClose: () => void;
};

function suggestLevelUpAction(input: string): string {
  const raw = input.trim();
  if (!raw) return "Do it for 5 minutes";
  const lower = raw.toLowerCase();

  if (lower.includes("read one page")) return "Read for 5 minutes";
  if (lower.includes("write one sentence")) return "Write for 5 minutes";
  if (lower.includes("meditate") || lower.includes("breathe")) return "Meditate for 3 minutes";
  if (lower.includes("pushup") && lower.match(/\d+/)) {
    const value = Number(lower.match(/\d+/)?.[0] ?? "5");
    return raw.replace(/\d+/, String(value * 2));
  }
  if (lower.includes("walk") && lower.includes("minute")) return "Walk for 10 minutes";
  if (lower.includes("stretch")) return "Stretch for 5 minutes";
  if (lower.includes("journal") || lower.includes("write")) return "Write for 5 minutes";

  return `${raw} for 5 minutes`;
}

export function LevelUpPrompt({
  habit,
  onLevelUp,
  onKeepCurrent,
  onMastered,
  onClose,
}: LevelUpPromptProps) {
  const [draftSuggestion, setDraftSuggestion] = useState(() =>
    habit ? suggestLevelUpAction(habit.twoMinuteVersion) : "",
  );

  const sparkles = useMemo(
    () =>
      Array.from({ length: 10 }, (_, index) => ({
        id: index,
        left: 10 + ((index * 9.3) % 80),
        delay: index * 0.12,
        duration: 2 + (index % 3) * 0.25,
      })),
    [],
  );

  return (
    <AnimatePresence>
      {habit && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-zinc-900/40 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-amber-200 bg-[linear-gradient(170deg,#fff9e8_0%,#fffdf6_45%,#fff9ed_100%)] p-6 shadow-[0_26px_80px_rgba(120,80,10,0.2)]"
          >
            <div className="pointer-events-none absolute inset-0">
              {sparkles.map((sparkle) => (
                <motion.span
                  key={sparkle.id}
                  className="absolute h-1.5 w-1.5 rounded-full bg-amber-300/70"
                  style={{ left: `${sparkle.left}%`, top: "82%" }}
                  animate={{ y: [-4, -120], opacity: [0, 1, 0], scale: [0.8, 1.1, 0.8] }}
                  transition={{ duration: sparkle.duration, repeat: Infinity, delay: sparkle.delay, ease: "easeOut" }}
                />
              ))}
            </div>

            <div className="relative z-10 space-y-5">
              <div className="text-center">
                <motion.p
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  className="font-[family-name:var(--font-instrument-serif)] text-5xl text-amber-600"
                >
                  {habit.streak}
                </motion.p>
                <h2 className="mt-2 font-[family-name:var(--font-instrument-serif)] text-3xl text-zinc-900">
                  🎯 30 days of {habit.action}!
                </h2>
                <p className="mt-2 text-zinc-700">You&apos;ve cast 30 votes for becoming {habit.identity}.</p>
                <p className="text-zinc-700">This habit is becoming part of who you are.</p>
              </div>

              <div className="rounded-2xl bg-white/75 p-4">
                <p className="font-medium text-zinc-800">The Goldilocks Rule: peak motivation comes from challenges at the edge of your ability.</p>
                <p className="mt-1 text-zinc-600">Ready to stretch a little?</p>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-zinc-200 bg-white/75 p-4">
                  <p className="text-sm text-zinc-500">Current</p>
                  <p className="text-zinc-900">{habit.twoMinuteVersion}</p>
                </div>
                <Input
                  label="Suggested"
                  labelPlacement="outside"
                  value={draftSuggestion}
                  onValueChange={setDraftSuggestion}
                  variant="bordered"
                />
              </div>

              <div className="space-y-2">
                <Button
                  radius="full"
                  className="w-full bg-amber-500 text-white hover:bg-amber-600"
                  onPress={() => onLevelUp(draftSuggestion.trim() || habit.twoMinuteVersion)}
                >
                  🚀 Level up
                </Button>
                <Button radius="full" variant="flat" className="w-full" onPress={onKeepCurrent}>
                  ✊ Keep current
                </Button>
                <Button
                  radius="full"
                  variant="light"
                  className="w-full text-amber-800"
                  onPress={onMastered}
                >
                  🏆 I&apos;ve mastered this → Hall of Fame
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
