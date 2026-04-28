"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";

type Contract = {
  id: number;
  original_filename: string;
  uploaded_at: string;
  score: number | null;
};

export default function DashboardPage() {
  const { user, language } = useAuthStore();
  const de = language === "de";
  const name = user?.first_name || user?.username || "";
  const t = (en: string, deStr: string) => (de ? deStr : en);

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(true);

  useEffect(() => {
    api.get("/contracts/")
      .then((r) => setContracts((r.data?.results ?? r.data ?? []).slice(0, 5)))
      .catch(() => setContracts([]))
      .finally(() => setLoadingContracts(false));
  }, []);

  // Latest contract for the score widget
  const latest = contracts[0] ?? null;

  const TOOLS = [    {
      href: "/scan",
      title: t("Scan a contract", "Vertrag scannen"),
      desc: t("Upload your Mietvertrag for clause-by-clause review.", "Lade deinen Mietvertrag für eine Klausel-Analyse hoch."),
      gradient: "from-brand-500 to-brand-700",
      icon: <path d="M9 11h6M9 15h4M7 5h10a2 2 0 0 1 2 2v12.5L15.5 17H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />,
    },
    {
      href: "/rent-check",
      title: t("Rent price check", "Mietpreis prüfen"),
      desc: t("Compare your rent to the Stuttgarter Mietspiegel.", "Vergleiche deine Miete mit dem Mietspiegel."),
      gradient: "from-emerald-500 to-emerald-700",
      icon: <path d="M4 19V5m0 14h16M8 16V10m4 6V7m4 9v-4" />,
    },
    {
      href: "/assistant",
      title: t("AI assistant", "KI-Assistent"),
      desc: t("Ask your contract anything in plain English.", "Stelle Fragen zu deinem Vertrag — auf Deutsch oder Englisch."),
      gradient: "from-fuchsia-500 to-purple-700",
      icon: <path d="M21 12a8 8 0 1 1-3.1-6.3L21 4l-1.3 3.6A8 8 0 0 1 21 12Z" />,
    },
    {
      href: "/deadlines",
      title: t("Deadlines", "Fristen"),
      desc: t("Notice periods, deposit return & more.", "Kündigungsfristen, Kaution & mehr."),
      gradient: "from-amber-500 to-orange-600",
      icon: <path d="M12 8v4l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
    },
  ];

  const score = latest?.score ?? null;

  return (
    <AppShell
      title={t(`Welcome back, ${name}`, `Willkommen zurück, ${name}`)}
      subtitle={t("Here's what's happening with your contracts today.", "Hier ist die Übersicht zu deinen Verträgen.")}
      actions={
        <Link href="/scan" className="btn-primary hidden sm:inline-flex">
          + {t("New contract", "Neuer Vertrag")}
        </Link>
      }
    >
      {/* Top row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Score widget */}
        <div className="card relative overflow-hidden p-7 lg:col-span-1">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-brand-100/50 blur-2xl" />
          <span className="label">{t("Latest contract score", "Letzter Vertrag · Score")}</span>
          <div className="relative mt-6 flex items-center gap-6">
            <ScoreRing value={score ?? 0} />
            <div>
              {score !== null ? (
                <p className="text-3xl font-extrabold tracking-tight">{score}<span className="text-base font-medium text-ink-400">/100</span></p>
              ) : (
                <p className="text-lg font-semibold text-ink-400">{t("No scan yet", "Noch kein Scan")}</p>
              )}
              <p className="mt-1 text-sm text-ink-500">
                {score !== null
                  ? t("Based on your latest scanned contract.", "Basierend auf deinem letzten gescannten Vertrag.")
                  : t("Upload and scan a contract to see your score.", "Lade einen Vertrag hoch und scanne ihn.")}
              </p>
              {latest && (
                <Link href={`/results/${latest.id}`} className="mt-3 inline-flex text-sm font-semibold text-brand-600 hover:text-brand-700">
                  {t("View full report →", "Vollständigen Bericht ansehen →")}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Quick tools */}
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          {TOOLS.map((c) => (
            <Link key={c.href} href={c.href} className="card-hover group flex items-start gap-4 p-6">
              <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${c.gradient} text-white shadow-pop`}>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{c.icon}</svg>
              </span>
              <div>
                <h3 className="font-semibold text-ink-900">{c.title}</h3>
                <p className="mt-1 text-sm text-ink-500">{c.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 group-hover:gap-2 transition-all">
                  {t("Open", "Öffnen")} →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Second row */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="section-title">{t("Recent contracts", "Letzte Verträge")}</h2>
              <p className="muted">{t("Your last uploads and their scores.", "Deine letzten Uploads und Scores.")}</p>
            </div>
            <Link href="/profile" className="text-sm font-semibold text-brand-600 hover:text-brand-700">{t("See all", "Alle anzeigen")} →</Link>
          </div>
          <div className="mt-5 divide-y divide-ink-100">
            {loadingContracts ? (
              <div className="flex items-center gap-2 py-6 text-sm text-ink-400">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-300 border-t-brand-500" />
                {t("Loading…", "Wird geladen…")}
              </div>
            ) : contracts.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-ink-500">{t("No contracts yet.", "Noch keine Verträge.")}</p>
                <Link href="/scan" className="btn-primary mt-4 inline-flex">
                  {t("Upload your first contract", "Ersten Vertrag hochladen")}
                </Link>
              </div>
            ) : (
              contracts.map((r) => (
                <Link key={r.id} href={`/results/${r.id}`} className="flex items-center gap-4 py-4 transition hover:bg-ink-50/50">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Zm0 0v5h5"/>
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900">{r.original_filename || `Contract #${r.id}`}</p>
                    <p className="text-xs text-ink-500">{new Date(r.uploaded_at).toLocaleDateString(de ? "de-DE" : "en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                  </div>
                  {r.score !== null ? (
                    <span className={`chip ${r.score >= 80 ? "chip-success" : r.score >= 60 ? "chip-warning" : "chip-danger"}`}>
                      {t("Score", "Score")} {r.score}
                    </span>
                  ) : (
                    <span className="chip-muted text-xs">{t("Not scanned", "Nicht analysiert")}</span>
                  )}
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="section-title">{t("Quick actions", "Schnellaktionen")}</h2>
          <div className="mt-4 flex flex-col gap-3">
            <Link href="/scan" className="btn-primary justify-start">📤 {t("Upload new contract", "Neuen Vertrag hochladen")}</Link>
            <Link href="/rent-check" className="btn-secondary justify-start">📊 {t("Check rent fairness", "Miete prüfen")}</Link>
            <Link href="/assistant" className="btn-secondary justify-start">💬 {t("Ask the assistant", "Assistenten fragen")}</Link>
            <Link href="/deadlines" className="btn-secondary justify-start">⏰ {t("View deadlines", "Fristen ansehen")}</Link>
          </div>
          <div className="mt-6 rounded-xl bg-brand-50 p-4 text-xs text-brand-800">
            <p className="font-semibold">💡 {t("Pro tip", "Profi-Tipp")}</p>
            <p className="mt-1 leading-relaxed text-brand-700/90">
              {t(
                "Always request a Wohnungsgeberbestätigung when you sign — you'll need it to register at the Bürgeramt.",
                "Fordere bei Vertragsunterzeichnung immer die Wohnungsgeberbestätigung an — du brauchst sie für die Anmeldung."
              )}
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function ScoreRing({ value }: { value: number }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const color = value >= 80 ? "#10b981" : value >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
      <circle cx="48" cy="48" r={r} stroke="#eef0f6" strokeWidth="10" fill="none" />
      <circle cx="48" cy="48" r={r} stroke={color} strokeWidth="10" fill="none"
              strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" />
    </svg>
  );
}

function Mini({ tone, count, label }: { tone: "danger" | "warning" | "success"; count: number; label: string }) {
  const cls =
    tone === "danger"  ? "bg-danger-50 text-danger-700"   :
    tone === "warning" ? "bg-warning-50 text-warning-700" :
                         "bg-success-50 text-success-700";
  return (
    <div className={`rounded-xl ${cls} px-3 py-3`}>
      <p className="text-xl font-bold">{count}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider">{label}</p>
    </div>
  );
}
