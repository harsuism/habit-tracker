"use client";

import { NavLink } from "react-router-dom";

const tabs = [
  { label: "Today", to: "/today" },
  { label: "Habits", to: "/habits" },
  { label: "Progress", to: "/progress" },
  { label: "Settings", to: "/settings" },
];

export function BottomTabs() {
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-zinc-200 bg-[#f9f6f1] px-4 pb-5 pt-3 backdrop-blur supports-[backdrop-filter]:bg-[#f9f6f1]/90">
      <ul className="mx-auto grid w-full max-w-xl grid-cols-4 gap-2">
        {tabs.map((tab) => (
          <li key={tab.to}>
            <NavLink
              to={tab.to}
              className={({ isActive }) =>
                [
                  "block rounded-xl px-2 py-2 text-center text-sm transition",
                  isActive ? "bg-amber-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-800",
                ].join(" ")
              }
            >
              {tab.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
