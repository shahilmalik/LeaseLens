"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

const LANGS = [
  { code: "en" as const, label: "English",  sub: "Continue in English", flag: "🇬🇧" },
  { code: "de" as const, label: "Deutsch",   sub: "Auf Deutsch fortfahren", flag: "🇩🇪" },
];

export default function SelectLanguagePage() {
  const router = useRouter();
  const { setLanguage, user, _hasHydrated, access } = useAuthStore();

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user || !access) router.replace("/login");
  }, [_hasHydrated, user, access, router]);

  if (!_hasHydrated) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400">Loading…</div>;
  }
  if (!user) return null;

  async function pick(code: "en" | "de") {
    setLanguage(code);
    try {
      await api.patch("/profile/", { language: code }, {
        headers: { Authorization: `Bearer ${access}` },
      });
    } catch { /* non-blocking */ }
    router.push("/upload");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-slate-50 p-8">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Step 1 of 2</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Hey {user.first_name || user.username}, choose your language
        </h1>
        <p className="mt-2 text-slate-500">Wähle deine Sprache · Choose your language</p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {LANGS.map((l) => (
          <button key={l.code} onClick={() => pick(l.code)}
            className="group flex w-48 flex-col items-center gap-3 rounded-2xl border-2 border-transparent bg-white p-8 shadow transition hover:border-brand hover:shadow-lg">
            <span className="text-5xl">{l.flag}</span>
            <span className="text-lg font-semibold text-slate-800 group-hover:text-brand">{l.label}</span>
            <span className="text-xs text-slate-400">{l.sub}</span>
          </button>
        ))}
      </div>
    </main>
  );
}
