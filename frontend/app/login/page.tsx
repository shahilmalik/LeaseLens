"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, clearAuth } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">(
    params.get("mode") === "register" ? "register" : "login"
  );
  const { setTokens, setUser } = useAuthStore();

  const [form, setFormState] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function patch(field: string, value: string) {
    setFormState((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
    setServerError(null);
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!form.username.trim()) errs.username = "Username is required.";
    else if (form.username.length < 3) errs.username = "At least 3 characters.";
    if (!form.password) errs.password = "Password is required.";
    else if (form.password.length < 8) errs.password = "At least 8 characters.";
    if (mode === "register") {
      if (!form.email.includes("@")) errs.email = "Valid email required.";
      if (form.password !== form.confirmPassword)
        errs.confirmPassword = "Passwords do not match.";
    }
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setServerError(null);
    // Wipe any stale token so the request interceptor doesn't send it
    clearAuth();
    try {
      if (mode === "register") {
        await api.post("/auth/register/", {
          username: form.username,
          email: form.email,
          password: form.password,
          first_name: form.firstName,
          last_name: form.lastName,
          language: "en",
        });
      }

      // Get JWT tokens
      const { data: tokens } = await api.post("/token/", {
        username: form.username,
        password: form.password,
      });

      // Save tokens to Zustand store
      setTokens(tokens.access, tokens.refresh);

      // Fetch user – pass token directly (localStorage not flushed yet)
      const { data: user } = await api.get("/auth/me/", {
        headers: { Authorization: `Bearer ${tokens.access}` },
      });
      setUser(user);

      router.push("/select-language");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: unknown } };
      const data = axiosErr?.response?.data;
      if (data && typeof data === "object") {
        const first = Object.values(data as Record<string, unknown>)[0];
        setServerError(Array.isArray(first) ? String(first[0]) : String(first));
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";
  const errCls = "mt-1 text-xs text-red-500";

  return (
    <main className="flex min-h-screen bg-slate-50">
      {/* Left brand panel – desktop only */}
      <div className="hidden lg:flex w-5/12 flex-col justify-between bg-brand p-14 text-white">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          Lease<span className="opacity-60">Lens</span>
        </Link>
        <div className="space-y-4">
          <p className="text-4xl font-semibold leading-snug">
            "Finally I understood what my landlord was actually asking me to sign."
          </p>
          <p className="text-sm text-blue-200">— Maria, exchange student from Spain 🇪🇸</p>
        </div>
        <p className="text-xs text-blue-300">© 2026 LeaseLens · Stuttgart</p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 block text-xl font-bold lg:hidden">
            Lease<span className="text-brand">Lens</span>
          </Link>

          <h1 className="text-2xl font-bold text-slate-900">
            {mode === "login" ? "Welcome back 👋" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {mode === "login"
              ? "Log in to continue to LeaseLens."
              : "Free forever. No credit card required."}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
            {mode === "register" && (
              <div className="grid grid-cols-2 gap-3">
                <input className={inputCls} placeholder="First name"
                  value={form.firstName} onChange={(e) => patch("firstName", e.target.value)} />
                <input className={inputCls} placeholder="Last name"
                  value={form.lastName} onChange={(e) => patch("lastName", e.target.value)} />
              </div>
            )}

            <div>
              <input className={inputCls} placeholder="Username" autoComplete="username"
                value={form.username} onChange={(e) => patch("username", e.target.value)} />
              {errors.username && <p className={errCls}>{errors.username}</p>}
            </div>

            {mode === "register" && (
              <div>
                <input type="email" className={inputCls} placeholder="Email address" autoComplete="email"
                  value={form.email} onChange={(e) => patch("email", e.target.value)} />
                {errors.email && <p className={errCls}>{errors.email}</p>}
              </div>
            )}

            <div>
              <input type="password" className={inputCls} placeholder="Password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={form.password} onChange={(e) => patch("password", e.target.value)} />
              {errors.password && <p className={errCls}>{errors.password}</p>}
            </div>

            {mode === "register" && (
              <div>
                <input type="password" className={inputCls} placeholder="Confirm password"
                  autoComplete="new-password"
                  value={form.confirmPassword} onChange={(e) => patch("confirmPassword", e.target.value)} />
                {errors.confirmPassword && <p className={errCls}>{errors.confirmPassword}</p>}
              </div>
            )}

            {serverError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {serverError}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-brand py-3 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">
              {loading ? "Please wait…" : mode === "login" ? "Log in →" : "Create account →"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === "login" ? "Don't have an account? " : "Already have one? "}
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setServerError(null); setErrors({}); }}
              className="font-semibold text-brand hover:underline">
              {mode === "login" ? "Sign up free" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-slate-400">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
