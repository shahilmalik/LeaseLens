"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { LANGUAGES, type LangCode } from "@/lib/i18n";

export default function SelectLanguagePage() {
  const router = useRouter();
  const { setLanguage, user, _hasHydrated, access, language } = useAuthStore();

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user || !access) router.replace("/login");
  }, [_hasHydrated, user, access, router]);

  if (!_hasHydrated) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400">Loading…</div>;
  }
  if (!user) return null;

  async function pick(code: LangCode) {
    setLanguage(code);
    try {
      await api.patch("/profile/", { language: code });
    } catch { /* non-blocking */ }
    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-slate-50 p-8">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">LeaseLens</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Hey {user.first_name || user.username}, choose your language
        </h1>
        <p className="mt-2 text-slate-500">Select the language you want to use across the app</p>
      </div>

      <div className="grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {LANGUAGES.map((l) => {
          const active = language === l.code;
          return (
            <button
              key={l.code}
              onClick={() => pick(l.code as LangCode)}
              className={`group flex flex-col items-center gap-2 rounded-2xl border-2 bg-white p-5 shadow-sm transition hover:shadow-md ${
                active
                  ? "border-blue-600 shadow-md ring-2 ring-blue-100"
                  : "border-transparent hover:border-blue-300"
              }`}
            >
              <span className="text-3xl">{l.flag}</span>
              <span className={`text-sm font-semibold ${active ? "text-blue-700" : "text-slate-800 group-hover:text-blue-600"}`}>
                {l.native}
              </span>
              <span className="text-[11px] text-slate-400">{l.label}</span>
              {active && (
                <span className="mt-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  ✓ Active
                </span>
              )}
            </button>
          );
        })}
      </div>
    </main>
  );
}
