"use client";

import { Bell, Moon, Search, Sun } from "lucide-react";

type TopNavbarProps = {
  title: string;
  role: "Admin" | "User";
  darkMode: boolean;
  language: string;
  onDarkModeToggle: () => void;
  onLanguageChange: (value: string) => void;
};

export function TopNavbar({
  title,
  role,
  darkMode,
  language,
  onDarkModeToggle,
  onLanguageChange,
}: TopNavbarProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-900">
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Government Assistance Dashboard</p>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <label className="hidden items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 md:flex dark:border-slate-600">
          <Search size={14} className="text-slate-500" />
          <input
            aria-label="Search"
            placeholder="Search services"
            className="w-40 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </label>
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="rounded-lg border border-slate-300 bg-transparent px-2 py-1 text-sm dark:border-slate-600"
          aria-label="Select language"
        >
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="mr">Marathi</option>
          <option value="ta">Tamil</option>
        </select>
        <button type="button" onClick={onDarkModeToggle} className="rounded-lg border border-slate-300 p-2 dark:border-slate-600">
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button type="button" className="rounded-lg border border-slate-300 p-2 dark:border-slate-600" aria-label="Notifications">
          <Bell size={16} />
        </button>
        <button type="button" className="rounded-lg border border-slate-300 px-3 py-1 text-sm dark:border-slate-600">
          {role}
        </button>
      </div>
    </header>
  );
}
