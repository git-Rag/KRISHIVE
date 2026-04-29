"use client";

import { ComponentType } from "react";
import { LayoutDashboard, Bell, Settings, FileBarChart2, BriefcaseBusiness, ChevronLeft, ChevronRight } from "lucide-react";

type NavItem = {
  id: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
};

type SidebarProps = {
  collapsed: boolean;
  activeId: string;
  onToggle: () => void;
  onSelect: (id: string) => void;
};

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "services", label: "Services", icon: BriefcaseBusiness },
  { id: "reports", label: "Reports / Analytics", icon: FileBarChart2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({ collapsed, activeId, onToggle, onSelect }: SidebarProps) {
  return (
    <aside className={`hidden border-r border-slate-200 bg-white transition-all dark:border-slate-700 dark:bg-slate-900 md:block ${collapsed ? "w-20" : "w-64"}`}>
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-[#0b3d91] text-center text-sm font-bold leading-8 text-white">GI</div>
          {!collapsed && <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">KRISHIVE Portal</span>}
        </div>
        <button onClick={onToggle} type="button" aria-label="Toggle sidebar" className="text-slate-600 dark:text-slate-300">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              type="button"
              className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${
                active ? "bg-[#0b3d91] text-white" : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              <Icon size={16} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
