"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import Link from "next/link";

type Tone = "danger" | "warning" | "info" | "success";

type Deadline = {
  title_en: string;
  title_de: string;
  detail_en: string;
  detail_de: string;
  type_en: string;
  type_de: string;
  date: string;
  tone: Tone;
};

type Contract = { id: number; original_filename: string; score: number | null };

const TONE: Record<Tone, { chip: string; ring: string }> = {
  danger:  { chip: "chip-danger",  ring: "border-l-danger-500" },
  warning: { chip: "chip-warning", ring: "border-l-warning-500" },
  info:    { chip: "chip-info",    ring: "border-l-brand-500" },
  success: { chip: "chip-success", ring: "border-l-success-500" },
};

export default function DeadlinesPage() {
  const { language } = useAuthStore();
  const de = language === "de";
  const t = (en: string, deStr: string) => (de ? deStr : en);

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(false);
  const [contractsLoading, setContractsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get("/contracts/")
      .then((r) => {
        const list: Contract[] = (r.data?.results ?? r.data ?? []).filter(
          (c: Contract) => c.score !== null
        );
        setContracts(list);
        if (list.length > 0) setSelectedId(list[0].id);
      })
      .catch(() => {})
      .finally(() => setContractsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setDeadlines([]);
    setError(null);
    setLoading(true);
    api.get(`/contracts/${selectedId}/deadlines/`)
      .then((r) => {
        const sorted = [...(r.data ?? [])].sort(
          (a: Deadline, b: Deadline) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setDeadlines(sorted);
      })
      .catch((e) => {
        setError(e?.response?.data?.detail || t("Failed to load deadlines.", "Fristen konnten nicht geladen werden."));
      })
      .finally(() => setLoading(false));
  }, [selectedId]);

  const today = new Date();
  function daysUntil(iso: string) {
    return Math.ceil((new Date(iso).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  function addToCalendar(d: Deadline) {
    const title = encodeURIComponent(de ? d.title_de : d.title_en);
    const details = encodeURIComponent(de ? d.detail_de : d.detail_en);
    const ds = d.date.replace(/-/g, "");
    window.open(
      `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${ds}/${ds}&details=${details}`,
      "_blank"
    );
  }

  const upcoming = deadlines.filter((d) => daysUntil(d.date) >= 0);
  const within30 = deadlines.filter((d) => daysUntil(d.date) >= 0 && daysUntil(d.date) <= 30);
  const critical = deadlines.filter((d) => d.tone === "danger");

  return (
    <AppShell
      title={t("Deadlines", "Fristen")}
      subtitle={t(
        "AI-generated from your contract — stay ahead of every important date.",
        "KI-generiert aus deinem Vertrag – behalte alle Termine im Blick."
      )}
    >
      {/* Contract selector */}
      <div className="card p-5">
        {contractsLoading ? (
          <div className="flex items-center gap-2 text-sm text-ink-400">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-200 border-t-brand-500" />
            {t("Loading contracts…", "Verträge werden geladen…")}
          </div>
        ) : contracts.length === 0 ? (
          <p className="text-sm text-ink-500">
            {t("No scanned contracts yet. ", "Noch keine analysierten Verträge. ")}
            <Link href="/scan" className="font-semibold text-brand-600 underline">
              {t("Scan one now →", "Jetzt analysieren →")}
            </Link>
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-semibold text-ink-600">{t("Contract", "Vertrag")}</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(Number(e.target.value))}
              className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.original_filename || `Contract #${c.id}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Stats strip */}
      {!loading && deadlines.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card p-5">
            <p className="label">{t("Upcoming", "Anstehend")}</p>
            <p className="mt-2 text-3xl font-extrabold">{upcoming.length}</p>
          </div>
          <div className="card p-5">
            <p className="label">{t("Within 30 days", "In 30 Tagen")}</p>
            <p className="mt-2 text-3xl font-extrabold text-warning-600">{within30.length}</p>
          </div>
          <div className="card p-5">
            <p className="label">{t("Critical", "Kritisch")}</p>
            <p className="mt-2 text-3xl font-extrabold text-danger-600">{critical.length}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="card p-12 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-ink-200 border-t-brand-500" />
          <p className="text-sm font-semibold text-ink-600">
            {t("Analysing contract for key dates…", "Vertrag wird auf wichtige Termine analysiert…")}
          </p>
          <p className="mt-1 text-xs text-ink-400">{t("Powered by Gemini AI", "Powered by Gemini KI")}</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="card border-danger-200 bg-danger-50 p-6 text-sm text-danger-700">{error}</div>
      )}

      {/* Timeline */}
      {!loading && !error && deadlines.length > 0 && (
        <div className="card p-6">
          <h2 className="section-title">{t("Your timeline", "Dein Zeitplan")}</h2>
          <ul className="mt-5 space-y-4">
            {deadlines.map((d, i) => {
              const meta = TONE[d.tone] ?? TONE.info;
              const days = daysUntil(d.date);
              return (
                <li key={i} className={`relative rounded-xl border border-ink-100 border-l-4 ${meta.ring} bg-white p-5 shadow-card`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={meta.chip}>{de ? d.type_de : d.type_en}</span>
                        <span className="text-xs text-ink-400">
                          {new Date(d.date).toLocaleDateString(de ? "de-DE" : "en-GB", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </span>
                      </div>
                      <h3 className="mt-1 font-semibold text-ink-900">{de ? d.title_de : d.title_en}</h3>
                      <p className="mt-1 text-sm text-ink-600">{de ? d.detail_de : d.detail_en}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className={`text-2xl font-extrabold ${days < 0 ? "text-ink-300" : days <= 30 ? "text-warning-600" : "text-ink-900"}`}>
                        {days < 0 ? "—" : `${days}d`}
                      </p>
                      <p className="text-xs text-ink-400">
                        {days < 0 ? t("Past", "Vergangen") : t("remaining", "verbleibend")}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button onClick={() => addToCalendar(d)} className="btn-ghost px-3 py-1.5 text-xs">
                      📅 {t("Add to Google Calendar", "In Google Kalender")}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {!loading && !error && deadlines.length === 0 && selectedId && (
        <div className="card p-10 text-center">
          <p className="text-sm text-ink-500">
            {t("No deadlines found for this contract.", "Keine Fristen für diesen Vertrag gefunden.")}
          </p>
        </div>
      )}

      <p className="mt-4 text-xs text-ink-400">
        {t(
          "Dates are estimates based on your contract clauses. Always verify with a Mieterverein or lawyer.",
          "Termine sind Schätzungen auf Basis deiner Vertragsklauseln. Bitte stets mit dem Mieterverein oder einem Anwalt prüfen."
        )}
      </p>
    </AppShell>
  );
}
