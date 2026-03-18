"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { firebaseAuth, firebaseDb } from "../../lib/firebase/client";
import type { UserRole } from "../../types";

const LoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginValues = z.infer<typeof LoginSchema>;

function roleToPath(role: UserRole): string {
  if (role === "mla") return "/mla";
  if (role === "admin") return "/admin";
  return "/dashboard";
}

async function fetchRole(uid: string): Promise<UserRole> {
  const snap = await getDoc(doc(firebaseDb, "users", uid));
  if (!snap.exists()) throw new Error("User profile not found");
  const role = (snap.data() as any)?.role as UserRole | undefined;
  if (!role || !["staff", "supervisor", "mla", "admin"].includes(role)) throw new Error("Invalid user role");
  return role;
}

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const nextParam = params.get("next");

  const [serverError, setServerError] = useState<string | null>(null);

  const defaultValues = useMemo<LoginValues>(() => ({ email: "", password: "" }), []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues,
    mode: "onSubmit",
  });

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);
    try {
      const cred = await signInWithEmailAndPassword(firebaseAuth, values.email, values.password);
      const role = await fetchRole(cred.user.uid);

      // If middleware passed a "next" route, prefer it when it matches the role area.
      const destination = nextParam && nextParam.startsWith("/") ? nextParam : roleToPath(role);

      router.replace(destination);
    } catch (e: any) {
      const msg = typeof e?.message === "string" ? e.message : "Login failed. Please try again.";
      setServerError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 grid grid-cols-1 md:grid-cols-[360px_1fr]">
      <aside className="hidden md:flex flex-col justify-between bg-[#1B2A4A] text-white p-10">
        <div>
          <div className="text-2xl font-semibold tracking-tight">P-CRM</div>
          <div className="mt-2 text-sm text-white/80">
            Smart Public Governance CRM for municipal grievance management.
          </div>
          <div className="mt-8 text-xs text-white/70 leading-relaxed">
            Staff accounts are provisioned by administrators. If you need access, contact your supervisor.
          </div>
        </div>
        <div className="text-xs text-white/60">JSPM JSCOE Innovation Challenge 2026</div>
      </aside>

      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="md:hidden mb-6">
            <div className="text-xl font-semibold text-[#1B2A4A]">P-CRM</div>
            <div className="text-sm text-slate-600">Staff Login</div>
          </div>

          <div className="hidden md:block mb-6">
            <h1 className="text-xl font-semibold text-slate-900">Staff Login</h1>
            <p className="text-sm text-slate-600 mt-1">Sign in with your municipal staff account.</p>
          </div>

          {serverError ? (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {serverError}
            </div>
          ) : null}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                autoComplete="email"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]"
                placeholder="name@municipality.gov.in"
                {...register("email")}
              />
              {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                autoComplete="current-password"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]"
                placeholder="••••••••"
                {...register("password")}
              />
              {errors.password ? <p className="mt-1 text-xs text-red-600">{errors.password.message}</p> : null}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-[#2563EB] px-4 py-2.5 text-white font-medium hover:bg-[#1d4ed8] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>

            <div className="text-xs text-slate-500">
              No registration is available. Accounts are created manually by the admin team.
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

