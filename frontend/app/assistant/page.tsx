"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";

type Msg = { role: "user" | "assistant"; text: string };

type Contract = { id: number; original_filename: string; score: number | null };

const SUGGESTIONS_EN = [
  "Is my cosmetic repair clause enforceable?",
  "How much notice do I need to give?",
  "Can my landlord raise the rent every year?",
  "What if I want to keep a cat?",
  "What does the deposit clause say?",
];
const SUGGESTIONS_DE = [
  "Ist meine Schönheitsreparatur-Klausel wirksam?",
  "Welche Kündigungsfrist gilt für mich?",
  "Darf der Vermieter jährlich erhöhen?",
  "Was, wenn ich eine Katze halten möchte?",
  "Was sagt die Kautions-Klausel?",
];

export default function AssistantPage() {
  const { language } = useAuthStore();
  const de = language === "de";
  const t = (en: string, deStr: string) => (de ? deStr : en);

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<number | "">("");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  // Load user's contracts for the selector
  useEffect(() => {
    api.get("/contracts/")
      .then((r) => {
        const list: Contract[] = r.data?.results ?? r.data ?? [];
        setContracts(list);
        // Prefer first scanned contract
        const first = list.find((c) => c.score !== null) ?? list[0];
        if (first) setSelectedContractId(first.id);
      })
      .catch(() => {});
  }, []);

  // When a contract is selected, open (or create) a chat session for it
  useEffect(() => {
    if (!selectedContractId) return;
    setSessionId(null);
    setMessages([]);
    setInitError(null);
    setInitLoading(true);

    api.post("/chat/", { contract: selectedContractId })
      .then((r) => {
        setSessionId(r.data.id);
        const contract = contracts.find((c) => c.id === selectedContractId);
        const filename = contract?.original_filename ?? "your contract";
        const isScanned = contract?.score !== null;

        // Restore existing message history from the session
        const history: Msg[] = (r.data.messages ?? []).map(
          (m: { role: string; content: string }) => ({ role: m.role as "user" | "assistant", text: m.content })
        );

        if (history.length > 0) {
          setMessages(history);
        } else if (!isScanned) {
          setMessages([{
            role: "assistant",
            text: de
              ? `⚠️ "${filename}" wurde noch nicht analysiert. Ich kann allgemeine Fragen beantworten, aber für vertragsbasierte Antworten bitte erst scannen.`
              : `⚠️ "${filename}" hasn't been scanned yet. I can answer general questions, but for contract-specific answers please scan it first.`,
          }]);
        } else {
          setMessages([{
            role: "assistant",
            text: de
              ? `Hallo 👋 Ich bin bereit, Fragen zu "${filename}" zu beantworten.`
              : `Hi 👋 Ready to answer questions about "${filename}".`,
          }]);
        }
      })
      .catch((e) => {
        const detail = e?.response?.data?.detail;
        setInitError(detail || t("Could not start chat session.", "Chat-Sitzung konnte nicht gestartet werden."));
      })
      .finally(() => setInitLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContractId]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy || !sessionId) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setBusy(true);
    try {
      const res = await api.post(`/chat/${sessionId}/ask/`, {
        question: q,
        language,
      });
      setMessages((m) => [...m, { role: "assistant", text: res.data.content }]);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      const errMsg = err?.response?.data?.detail || t("Request failed.", "Anfrage fehlgeschlagen.");
      setMessages((m) => [...m, { role: "assistant", text: `⚠️ ${errMsg}` }]);
    } finally {
      setBusy(false);
    }
  }

  const suggestions = de ? SUGGESTIONS_DE : SUGGESTIONS_EN;
  const selectedContract = contracts.find((c) => c.id === selectedContractId);
  const isUnscanned = selectedContract && selectedContract.score === null;

  return (
    <AppShell
      title={t("AI Assistant", "KI-Assistent")}
      subtitle={t("Grounded in your contract — powered by Gemini.", "Bezieht sich auf deinen Vertrag — powered by Gemini.")}
    >
      <div className="grid gap-6 lg:grid-cols-4">
        {/* ---- Chat panel ---- */}
        <div className="card flex h-[72vh] flex-col p-0 lg:col-span-3">
          {/* Header with contract selector */}
          <div className="flex items-center gap-3 border-b border-ink-100 px-6 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-700 text-white shadow-pop">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a8 8 0 1 1-3.1-6.3L21 4l-1.3 3.6A8 8 0 0 1 21 12Z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">LeaseLens AI</p>
              {contracts.length > 0 ? (
                <select
                  value={selectedContractId}
                  onChange={(e) => setSelectedContractId(Number(e.target.value))}
                  className="mt-0.5 block w-full max-w-xs truncate rounded-lg border border-ink-200 bg-white px-2 py-1 text-xs text-ink-700 focus:outline-none focus:ring-2 focus:ring-brand/20"
                >
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.original_filename || `Contract #${c.id}`}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-ink-500">
                  {t("No contracts — ", "Keine Verträge — ")}
                  <Link href="/scan" className="font-semibold text-brand-600 underline">{t("upload one", "hochladen")}</Link>
                </p>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
            {initError && (
              <div className="rounded-xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700">
                {initError}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-700 text-white">
                    <span className="text-xs font-bold">AI</span>
                  </div>
                )}
                <div
                  className={`max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-brand-600 text-white"
                      : "border border-ink-100 bg-surface-muted text-ink-800"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-700 text-white text-xs font-bold">
                  AI
                </div>
                <div className="rounded-2xl border border-ink-100 bg-surface-muted px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-ink-300" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-ink-300 [animation-delay:120ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-ink-300 [animation-delay:240ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="border-t border-ink-100 p-4">
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex items-center gap-2 rounded-2xl border border-ink-200 bg-white px-3 py-2 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand/15"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  !sessionId
                    ? t("Select a contract to start…", "Vertrag auswählen…")
                    : t("Ask about your contract…", "Frage zu deinem Vertrag…")
                }
                disabled={!sessionId || busy}
                className="flex-1 bg-transparent px-2 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={busy || !input.trim() || !sessionId}
                className="btn-primary px-4 py-2"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
                </svg>
              </button>
            </form>
          </div>
        </div>

        {/* ---- Suggestions sidebar ---- */}
        <div className="card p-6">
          <h3 className="section-title">{t("Try asking", "Vorschläge")}</h3>
          <div className="mt-4 flex flex-col gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={!sessionId || busy}
                className="rounded-xl border border-ink-100 bg-surface-muted px-4 py-3 text-left text-sm text-ink-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>
          <div className="mt-6 rounded-xl bg-warning-50 p-4 text-xs text-warning-700">
            ⚠️ {t("AI answers are informational, not legal advice.", "KI-Antworten sind informativ, keine Rechtsberatung.")}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
