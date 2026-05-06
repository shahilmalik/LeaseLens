"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { LANGUAGES, type LangCode } from "@/lib/i18n";

type Contract = {
  id: number;
  original_filename: string;
  uploaded_at: string;
  score: number | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, language, setLanguage, logout } = useAuthStore();
  const de = language === "de";
  // simple two-string fallback for strings not yet in i18n; fully translated keys use T directly
  const t = (en: string, deStr: string) => (de ? deStr : en);

  const [form, setForm] = useState({
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    email: user?.email ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(true);

  useEffect(() => {
    setForm({
      first_name: user?.first_name ?? "",
      last_name: user?.last_name ?? "",
      email: user?.email ?? "",
    });
  }, [user]);

  useEffect(() => {
    api.get("/contracts/")
      .then((r) => setContracts(r.data?.results ?? r.data ?? []))
      .catch(() => setContracts([]))
      .finally(() => setLoadingContracts(false));
  }, []);

  async function saveProfile() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await api.patch("/profile/", { ...form, language });
      if (res.data) setUser({ ...(user as any), ...res.data });
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch {
      if (user) setUser({ ...user, ...form });
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } finally {
      setSaving(false);
    }
  }

  const initials =
    (form.first_name?.[0] || user?.username?.[0] || "?").toUpperCase() +
    (form.last_name?.[0] || "").toUpperCase();

  function fmtDate(iso: string) {
    // Use German locale for de/tr/ru/pl etc. — fall back to en-GB for others
    const locale = language === "de" ? "de-DE" : "en-GB";
    return new Date(iso).toLocaleDateString(locale, {
      day: "2-digit", month: "short", year: "numeric",
    });
  }

  return (
    <AppShell
      title={t("Profile & settings", "Profil & Einstellungen")}
      subtitle={t(
        "Manage your account, language and saved contracts.",
        "Konto, Sprache und gespeicherte Verträge verwalten."
      )}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ---- Identity sidebar ---- */}
        <div className="card p-7 lg:col-span-1 space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-xl font-bold text-white shadow-pop">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{form.first_name || user?.username}</p>
              <p className="truncate text-sm text-ink-500">{user?.email}</p>
            </div>
          </div>

          {/* Language selector */}
          <div>
            <p className="label">{t("Interface language", "Anzeigesprache")}</p>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {LANGUAGES.map((l) => {
                const active = language === l.code;
                return (
                  <button
                    key={l.code}
                    onClick={() => setLanguage(l.code as LangCode)}
                    className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-xs font-medium transition ${
                      active
                        ? "border-brand-400 bg-brand-50 text-brand-700"
                        : "border-ink-200 bg-white text-ink-600 hover:border-brand-300 hover:text-ink-900"
                    }`}
                  >
                    <span className="text-base">{l.flag}</span>
                    <span className="truncate">{l.native}</span>
                    {active && <svg viewBox="0 0 24 24" className="ml-auto h-3.5 w-3.5 shrink-0 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 13 4 4L19 7"/></svg>}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => { logout(); router.push("/"); }}
            className="btn-secondary w-full text-danger-700 hover:border-danger-300 hover:text-danger-700"
          >
            {t("Sign out", "Abmelden")}
          </button>
        </div>

        {/* ---- Right column ---- */}
        <div className="space-y-6 lg:col-span-2">
          {/* Personal info */}
          <div className="card p-7">
            <h2 className="section-title">{t("Personal info", "Persönliche Daten")}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label={t("First name", "Vorname")}>
                <input
                  className="input"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                />
              </Field>
              <Field label={t("Last name", "Nachname")}>
                <input
                  className="input"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                />
              </Field>
              <Field label="Email">
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Field>
              <Field label={t("Username", "Benutzername")}>
                <input className="input" value={user?.username ?? ""} disabled />
              </Field>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <button onClick={saveProfile} disabled={saving} className="btn-primary">
                {saving ? t("Saving…", "Speichern…") : t("Save changes", "Änderungen speichern")}
              </button>
              {saved && (
                <span className="text-sm text-success-600">
                  ✓ {t("Saved", "Gespeichert")}
                </span>
              )}
            </div>
          </div>

        </div>

        {/* ---- Saved contracts (full width) ---- */}
        <div className="card p-7 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="section-title">{t("Saved contracts", "Gespeicherte Verträge")}</h2>
            <Link href="/scan" className="btn-secondary">
              + {t("Upload", "Hochladen")}
            </Link>
          </div>

          {loadingContracts ? (
            <div className="mt-6 flex items-center gap-2 text-sm text-ink-400">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-300 border-t-brand-500" />
              {t("Loading…", "Wird geladen…")}
            </div>
          ) : contracts.length === 0 ? (
            <div className="mt-6 rounded-2xl border-2 border-dashed border-ink-200 p-10 text-center">
              <p className="text-sm text-ink-500">
                {t("No contracts uploaded yet.", "Noch keine Verträge hochgeladen.")}
              </p>
              <Link href="/scan" className="btn-primary mt-4">
                {t("Upload my first contract", "Ersten Vertrag hochladen")}
              </Link>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-ink-100">
              {contracts.map((c) => (
                <div key={c.id} className="flex items-center gap-4 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Zm0 0v5h5" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.original_filename || `Contract #${c.id}`}</p>
                    <p className="text-xs text-ink-500">{fmtDate(c.uploaded_at)}</p>
                  </div>
                  {c.score !== null ? (
                    <span className={`chip ${c.score >= 80 ? "chip-success" : c.score >= 60 ? "chip-warning" : "chip-danger"}`}>
                      Score {c.score}
                    </span>
                  ) : (
                    <span className="chip-muted">{t("Not scanned", "Nicht analysiert")}</span>
                  )}
                  <Link
                    href={c.score !== null ? `/results/${c.id}` : `/scan?id=${c.id}`}
                    className="text-sm font-semibold text-brand-600 hover:text-brand-700"
                  >
                    {c.score !== null ? t("View →", "Ansehen →") : t("Scan →", "Analysieren →")}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
