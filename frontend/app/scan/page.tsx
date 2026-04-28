"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";

type Stage = "idle" | "uploading" | "uploaded" | "scanning" | "done" | "error";
type Tab = "upload" | "existing";

type SavedContract = { id: number; original_filename: string; uploaded_at: string; score: number | null };

const CHECKS = [
  { en: "Cosmetic repairs (Schönheitsreparaturen)", de: "Schönheitsreparaturen" },
  { en: "Operating costs (Betriebskosten)",          de: "Betriebskosten" },
  { en: "Notice period & duration",                  de: "Kündigungsfrist & Laufzeit" },
  { en: "Security deposit (Kaution)",                de: "Kaution" },
  { en: "Rent escalation / index clauses",           de: "Indexmiete / Staffelmiete" },
  { en: "Pet keeping (Tierhaltung)",                 de: "Tierhaltung" },
  { en: "Subletting (Untervermietung)",              de: "Untervermietung" },
  { en: "Renovation on move-out",                    de: "Renovierung beim Auszug" },
];

export default function ScanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useAuthStore();
  const de = language === "de";
  const t = (en: string, deStr: string) => (de ? deStr : en);

  // Tab: upload a new file, or pick a saved contract
  const [tab, setTab] = useState<Tab>("upload");

  // Saved contracts list (for "existing" tab)
  const [saved, setSaved] = useState<SavedContract[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [contractId, setContractId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // If ?id= is in the URL, switch to "existing" tab with that contract pre-selected
  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam) {
      const n = parseInt(idParam, 10);
      if (!isNaN(n)) {
        setTab("existing");
        setSelectedId(n);
        setContractId(n);
      }
    }
  }, [searchParams]);

  // Load saved contracts when the "existing" tab is active
  useEffect(() => {
    if (tab !== "existing") return;
    setLoadingSaved(true);
    api.get("/contracts/")
      .then((r) => {
        const list: SavedContract[] = r.data?.results ?? r.data ?? [];
        setSaved(list);
        if (!selectedId && list.length > 0) {
          setSelectedId(list[0].id);
          setContractId(list[0].id);
        }
      })
      .catch(() => setSaved([]))
      .finally(() => setLoadingSaved(false));
  }, [tab]);

  function pick(f: File | null) {
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      setError(t("Please upload a PDF.", "Bitte lade eine PDF hoch."));
      return;
    }
    if (f.size > 15 * 1024 * 1024) {
      setError(t("File too large (max 15 MB).", "Datei zu groß (max. 15 MB)."));
      return;
    }
    setError(null);
    setFile(f);
  }

  async function upload() {
    if (!file) return;
    setError(null);
    setStage("uploading");
    setProgress(10);
    setStatusMsg(t("Uploading PDF…", "PDF wird hochgeladen…"));
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/contracts/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (e.total) setProgress(10 + Math.round((e.loaded / e.total) * 85));
        },
      });
      setContractId(res.data.id);
      setProgress(100);
      setStage("uploaded");
      setStatusMsg(t("Contract saved!", "Vertrag gespeichert!"));
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || t("Upload failed.", "Upload fehlgeschlagen.");
      setError(msg);
      setStage("error");
      setProgress(0);
    }
  }

  async function scan(idOverride?: number) {
    const id = idOverride ?? contractId;
    if (!id) return;
    setContractId(id);
    setError(null);
    setStage("scanning");
    setProgress(20);
    setStatusMsg(t("Analysing clauses with Gemini…", "Klauseln werden mit Gemini analysiert…"));
    const ticker = setInterval(() => setProgress((p) => (p < 90 ? p + 2 : p)), 700);
    try {
      const scanRes = await api.post(`/contracts/${id}/scan/`);
      clearInterval(ticker);
      if (scanRes.data?.detail) throw new Error(scanRes.data.detail);
      setProgress(100);
      setStage("done");
      setStatusMsg(t("Done — opening report…", "Fertig — Bericht öffnet…"));
      setTimeout(() => router.push(`/results/${id}`), 700);
    } catch (e: any) {
      clearInterval(ticker);
      const msg = e?.response?.data?.detail || e?.message || t("Scan failed.", "Analyse fehlgeschlagen.");
      setError(msg);
      setStage(tab === "existing" ? "idle" : "uploaded");
      setProgress(0);
    }
  }

  const savedOrScanning = stage === "uploaded" || stage === "scanning" || stage === "done";
  const isScanning = stage === "scanning" || stage === "done";

  return (
    <AppShell
      title={t("Scan a contract", "Vertrag scannen")}
      subtitle={t(
        "Upload a new PDF or pick one you've already saved — then run the AI analysis.",
        "Lade eine neue PDF hoch oder wähle eine gespeicherte — dann starte die KI-Analyse."
      )}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Main card ── */}
        <div className="card p-7 lg:col-span-2 space-y-6">

          {/* Tab switcher */}
          {!isScanning && (
            <div className="flex rounded-xl border border-ink-200 bg-white p-1 w-fit">
              {(["upload", "existing"] as Tab[]).map((t_) => (
                <button
                  key={t_}
                  onClick={() => { setTab(t_); setError(null); }}
                  className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
                    tab === t_ ? "bg-brand-600 text-white" : "text-ink-500 hover:text-ink-900"
                  }`}
                >
                  {t_ === "upload"
                    ? t("📤 Upload new", "📤 Neu hochladen")
                    : t("📁 My contracts", "📁 Meine Verträge")}
                </button>
              ))}
            </div>
          )}

          {/* ── TAB: Upload ── */}
          {tab === "upload" && !isScanning && (
            <>
              <div>
                <p className="label mb-3">{t("Step 1 — Choose your contract PDF", "Schritt 1 — PDF auswählen")}</p>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0] ?? null); }}
                  onClick={() => { if (stage !== "uploaded") inputRef.current?.click(); }}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition ${
                    drag ? "border-brand-500 bg-brand-50" :
                    stage === "uploaded" ? "border-success-300 bg-success-50 cursor-default" :
                    "border-ink-200 bg-surface-muted hover:border-brand-300"
                  }`}
                >
                  {stage === "uploaded" ? (
                    <>
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success-600 text-white shadow-pop text-2xl">✓</span>
                      <p className="mt-4 text-base font-semibold text-success-700">
                        {t("Contract saved to your account", "Vertrag in deinem Konto gespeichert")}
                      </p>
                      <p className="mt-1 text-sm text-ink-500">{file?.name}</p>
                    </>
                  ) : (
                    <>
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-pop">
                        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 16V4m0 0-4 4m4-4 4 4M4 20h16" />
                        </svg>
                      </div>
                      <p className="mt-4 text-base font-semibold text-ink-900">
                        {t("Drop your contract here", "Ziehe deinen Vertrag hierher")}
                      </p>
                      <p className="mt-1 text-sm text-ink-500">
                        {t("or click to browse · PDF up to 15 MB", "oder zum Auswählen klicken · PDF bis 15 MB")}
                      </p>
                    </>
                  )}
                  <input ref={inputRef} type="file" accept="application/pdf" hidden onChange={(e) => pick(e.target.files?.[0] ?? null)} />
                </div>
              </div>

              {/* File row */}
              {file && stage !== "uploaded" && (
                <div className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white px-4 py-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Zm0 0v5h5" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900">{file.name}</p>
                    <p className="text-xs text-ink-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  {stage === "idle" && (
                    <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-xs text-ink-500 hover:text-danger-600">
                      {t("Remove", "Entfernen")}
                    </button>
                  )}
                </div>
              )}

              {/* Upload progress */}
              {stage === "uploading" && (
                <div>
                  <div className="flex justify-between text-xs text-ink-500 mb-1"><span>{statusMsg}</span><span>{progress}%</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                    <div className="h-full bg-gradient-to-r from-brand-500 to-brand-700 transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              {/* Step 2 — after upload */}
              {stage === "uploaded" && (
                <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6 space-y-4">
                  <p className="label">{t("Step 2 — Run AI analysis", "Schritt 2 — KI-Analyse starten")}</p>
                  <p className="text-sm text-ink-600">
                    {t(
                      "Your contract is saved. Analyse it now with Gemini AI, or come back later from your profile.",
                      "Dein Vertrag ist gespeichert. Analysiere ihn jetzt oder rufe ihn später über dein Profil auf."
                    )}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => scan()} className="btn-primary">
                      🔍 {t("Analyse now with Gemini", "Jetzt mit Gemini analysieren")}
                    </button>
                    <Link href="/profile" className="btn-secondary">{t("Save for later", "Später analysieren")}</Link>
                  </div>
                  <p className="text-xs text-ink-400">{t("Analysis takes 15–30 seconds.", "Die Analyse dauert 15–30 Sekunden.")}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {(stage === "idle" || stage === "error") && (
                  <button onClick={upload} disabled={!file} className="btn-primary">
                    {t("Upload & save", "Hochladen & speichern")}
                  </button>
                )}
                {(stage === "idle" || stage === "error" || stage === "uploaded") && (
                  <button onClick={() => { setFile(null); setStage("idle"); setError(null); setProgress(0); setStatusMsg(""); setContractId(null); }} className="btn-ghost">
                    {t("Reset", "Zurücksetzen")}
                  </button>
                )}
              </div>
            </>
          )}

          {/* ── TAB: Existing contracts ── */}
          {tab === "existing" && !isScanning && (
            <div className="space-y-4">
              <p className="label">{t("Choose a saved contract to (re-)analyse", "Gespeicherten Vertrag auswählen und analysieren")}</p>

              {loadingSaved ? (
                <div className="flex items-center gap-2 py-6 text-sm text-ink-400">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-300 border-t-brand-500" />
                  {t("Loading…", "Wird geladen…")}
                </div>
              ) : saved.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-ink-200 p-10 text-center">
                  <p className="text-sm text-ink-500">{t("No saved contracts yet.", "Noch keine gespeicherten Verträge.")}</p>
                  <button onClick={() => setTab("upload")} className="btn-primary mt-4">
                    {t("Upload your first contract", "Ersten Vertrag hochladen")}
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-ink-100 rounded-2xl border border-ink-100 overflow-hidden">
                  {saved.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedId(c.id); setContractId(c.id); setError(null); }}
                      className={`flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-ink-50 ${
                        selectedId === c.id ? "bg-brand-50 border-l-4 border-brand-500" : ""
                      }`}
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Zm0 0v5h5" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink-900">{c.original_filename || `Contract #${c.id}`}</p>
                        <p className="text-xs text-ink-500">
                          {new Date(c.uploaded_at).toLocaleDateString(de ? "de-DE" : "en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      {c.score !== null ? (
                        <span className={`chip ${c.score >= 80 ? "chip-success" : c.score >= 60 ? "chip-warning" : "chip-danger"}`}>
                          Score {c.score}
                        </span>
                      ) : (
                        <span className="chip-muted text-xs">{t("Not scanned", "Nicht analysiert")}</span>
                      )}
                      {selectedId === c.id && <span className="text-brand-600 font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              )}

              {selectedId && (
                <div className="flex flex-wrap gap-3 pt-2">
                  <button onClick={() => scan(selectedId)} className="btn-primary">
                    🔍 {t("Analyse with Gemini", "Mit Gemini analysieren")}
                  </button>
                  <Link href={`/results/${selectedId}`} className="btn-secondary">
                    {t("View last report →", "Letzten Bericht ansehen →")}
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* ── Scan progress (shared) ── */}
          {stage === "scanning" && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-ink-500"><span>{statusMsg}</span><span>{progress}%</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                <div className="h-full bg-gradient-to-r from-brand-500 to-brand-700 transition-all duration-700" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-ink-400">
                {t("This can take 15–30 seconds while Gemini reads every clause.", "Das kann 15–30 Sekunden dauern, während Gemini jede Klausel liest.")}
              </p>
            </div>
          )}

          {stage === "done" && (
            <div className="flex items-center gap-2 text-sm text-success-700 font-medium">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-success-300 border-t-success-600" />
              {statusMsg}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700">
              {error}
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="card p-7 space-y-6">
          <div>
            <h3 className="section-title">{t("What Gemini checks", "Was Gemini prüft")}</h3>
            <p className="muted mt-1">
              {t(
                "Every clause benchmarked against German tenancy law and BGH rulings.",
                "Jede Klausel anhand des deutschen Mietrechts und BGH-Urteilen bewertet."
              )}
            </p>
            <ul className="mt-5 space-y-3 text-sm text-ink-700">
              {CHECKS.map((c, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-success-100 text-success-700">
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12 5 5 9-11" />
                    </svg>
                  </span>
                  {de ? c.de : c.en}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl bg-brand-50 p-4 text-xs text-brand-800">
            <p className="font-semibold">💡 {t("How it works", "So funktioniert es")}</p>
            <ol className="mt-2 space-y-1 list-decimal list-inside text-brand-700/90 leading-relaxed">
              <li>{t("Upload your PDF — saved instantly.", "PDF hochladen — sofort gespeichert.")}</li>
              <li>{t('Click "Analyse" to run the AI scan.', 'Auf "Analysieren" klicken.')}</li>
              <li>{t("Review every clause in the report.", "Klauselbefunde im Bericht prüfen.")}</li>
            </ol>
          </div>

          <div className="rounded-xl bg-ink-50 p-4 text-xs text-ink-600">
            🔒 {t(
              "Files are encrypted in transit and deletable anytime from your profile.",
              "Dateien werden verschlüsselt übertragen und können jederzeit im Profil gelöscht werden."
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
