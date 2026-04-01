"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { NotificationBell } from "./NotificationBell";

function titleFromPath(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname === "/staff-dashboard") return "Dashboard";
  if (pathname === "/cases") return "Cases";
  if (pathname.startsWith("/cases/")) return "Case Details";
  if (pathname === "/mla") return "MLA View";
  if (pathname === "/mla-dashboard") return "MLA View";
  if (pathname === "/admin") return "Admin Panel";
  return "P-CRM";
}

export type HeaderProps = {
  onMenuToggle?: () => void;
  title?: string;
};

export function Header({ onMenuToggle, title }: HeaderProps) {
  const pathname = usePathname();
  const computed = useMemo(() => title ?? titleFromPath(pathname), [title, pathname]);

  return (
    <header className="w-full bg-white border-b border-slate-200">
      <div className="h-14 px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-100 text-[#1B2A4A]"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="text-base md:text-lg font-semibold text-[#1B2A4A]">{computed}</div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}

