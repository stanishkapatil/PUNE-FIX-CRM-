"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AlertCircle, FileText, LayoutDashboard, LogOut, Shield, UserCircle2 } from "lucide-react";
import { signOut } from "firebase/auth";

import { firebaseAuth } from "../../lib/firebase/client";
import { getCurrentUser } from "../../lib/utils/auth";
import { UserRole } from "../../types";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: UserRole[];
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/staff-dashboard") return pathname === "/staff-dashboard" || pathname === "/dashboard";
  if (href === "/cases") return pathname === "/cases" || pathname.startsWith("/cases/");
  if (href === "/mla-dashboard") return pathname === "/mla-dashboard" || pathname === "/mla";
  if (href === "/admin") return pathname === "/admin";
  return pathname === href;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [role, setRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const current = await getCurrentUser();
        if (!mounted) return;
        setRole(current?.role ?? null);
        setEmail(current?.user.email ?? null);
        setName((current as any)?.profile?.name ?? null);
      } catch {
        if (!mounted) return;
        setRole(null);
        setEmail(firebaseAuth.currentUser?.email ?? null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const navItems: NavItem[] = useMemo(
    () => [
      {
        label: "Dashboard",
        href: "/staff-dashboard",
        icon: <LayoutDashboard className="h-4 w-4" aria-hidden="true" />,
      },
      { label: "Cases", href: "/cases", icon: <FileText className="h-4 w-4" aria-hidden="true" /> },
      {
        label: "Alerts",
        href: "/staff-dashboard?view=alerts",
        icon: <AlertCircle className="h-4 w-4" aria-hidden="true" />,
      },
      {
        label: "MLA View",
        href: "/mla-dashboard",
        icon: <UserCircle2 className="h-4 w-4" aria-hidden="true" />,
        roles: [UserRole.mla, UserRole.admin],
      },
      {
        label: "Admin",
        href: "/admin",
        icon: <Shield className="h-4 w-4" aria-hidden="true" />,
        roles: [UserRole.admin],
      },
    ],
    [],
  );

  const visibleItems = navItems.filter((i) => !i.roles || (role ? i.roles.includes(role) : false));

  const doLogout = async () => {
    try {
      await fetch("/api/v1/auth/session", { method: "DELETE" });
    } catch {
      // best-effort (local cookie clear); signOut still ensures client state is cleared
    }
    await signOut(firebaseAuth);
    router.replace("/login");
  };

  return (
    <aside className="hidden md:flex md:flex-col md:w-72 bg-[#1B2A4A] text-white min-h-screen">
      <div className="px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center font-semibold">
            P
          </div>
          <div>
            <div className="text-lg font-semibold tracking-tight">P-CRM</div>
            <div className="text-xs text-white/70">Smart Governance</div>
          </div>
        </div>
      </div>

      <nav className="px-3 py-2 flex-1">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const active = isActive(pathname, item.href.split("?")[0]!);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={[
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-[#2563EB] text-white" : "text-white/80 hover:bg-white/10 hover:text-white",
                  ].join(" ")}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="text-xs text-white/60">Signed in as</div>
        <div className="mt-1 text-sm font-semibold text-white truncate">{name ?? email ?? "Staff"}</div>
        {role ? <div className="mt-1 text-xs text-white/70 uppercase tracking-wide">{role}</div> : null}

        <button
          type="button"
          onClick={doLogout}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Logout
        </button>
      </div>
    </aside>
  );
}

