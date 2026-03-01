"use client";

import { Button, Input, Textarea } from "@heroui/react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppState } from "../state/context";

export function HabitEditScreen() {
  const navigate = useNavigate();
  const { habitId } = useParams<{ habitId: string }>();
  const { state, dispatch } = useAppState();

  const habit = useMemo(() => state.habits.find((item) => item.id === habitId), [habitId, state.habits]);

  const [twoMinuteVersion, setTwoMinuteVersion] = useState(habit?.twoMinuteVersion ?? "");
  const [time, setTime] = useState(habit?.time ?? "");
  const [location, setLocation] = useState(habit?.location ?? "");
  const [environmentNote, setEnvironmentNote] = useState(habit?.environmentNote ?? "");

  if (!habit) {
    return (
      <section className="space-y-4">
        <h1 className="font-[family-name:var(--font-instrument-serif)] text-4xl text-zinc-900">habit not found</h1>
        <Button onPress={() => navigate("/habits")} variant="flat">
          back to habits
        </Button>
      </section>
    );
  }

  const save = () => {
    dispatch({
      type: "upsert_habit",
      payload: {
        ...habit,
        twoMinuteVersion: twoMinuteVersion.trim() || habit.twoMinuteVersion,
        time,
        location: location.trim(),
        environmentNote: environmentNote.trim() || null,
      },
    });
    navigate("/reflection");
  };

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6 pb-20">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.16em] text-zinc-500">adjust habit</p>
        <h1 className="font-[family-name:var(--font-instrument-serif)] text-4xl text-zinc-900">tune your system</h1>
      </header>

      <div className="space-y-4 rounded-2xl bg-[#fffdf9] p-5">
        <p className="text-zinc-600">{habit.identity}</p>
        <Input
          label="two-minute version"
          labelPlacement="outside"
          value={twoMinuteVersion}
          onValueChange={setTwoMinuteVersion}
          variant="bordered"
        />
        <Input type="time" label="time" labelPlacement="outside" value={time} onValueChange={setTime} variant="bordered" />
        <Input
          label="location"
          labelPlacement="outside"
          value={location}
          onValueChange={setLocation}
          variant="bordered"
        />
        <Textarea
          label="environment note"
          labelPlacement="outside"
          minRows={3}
          value={environmentNote}
          onValueChange={setEnvironmentNote}
          variant="bordered"
        />
      </div>

      <div className="flex items-center justify-between">
        <Button variant="light" onPress={() => navigate("/reflection")}>back</Button>
        <Button className="bg-amber-500 text-white hover:bg-amber-600" onPress={save}>
          save adjustment
        </Button>
      </div>
    </section>
  );
}
