"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";

// ---- types ----
type Severity = "red" | "yellow" | "green";

type Clause = {
  id: number;
  section: string;
  category: string;
  severity: Severity;
  original_text: string;
  explanation_en: string;
  explanation_de: string;
  recommendation_en: string;
  recommendation_de: string;
};

type Contract = {
  id: number;
  original_filename: string;
  uploaded_at: string;
  score: number | null;
  clauses: Clause[];
};

// ---- severity mapping (backend uses red/yellow/green) ----
const SEV: Record<Severity, { label: { en: string; de: string }; chip: string; ring: string; dot: string }> = {
  red:    { label: { en: "Critical", de: "Kritisch" }, chip: "chip-danger",  ring: "border-danger-200 bg-danger-50",   dot: "bg-danger-500" },
  yellow: { label: { en: "Review",   de: "Prüfen" },   chip: "chip-warning", ring: "border-warning-200 bg-warning-50", dot: "bg-warning-500" },
  green:  { label: { en: "Good",     de: "OK" },        chip: "chip-success", ring: "border-success-200 bg-success-50", dot: "bg-success-500" },
};

type Filter = "all" | Severity;

export default function ResultsPage() {
  const params = useParams<{ id: string }>();
  const { language } = useAuthStore();
  const de = language === "de";
  const t = (en: string, deStr: string) => (de ? deStr : en);

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    api.get(`/contracts/${params.id}/`)
      .then((r) => {
        setContract(r.data);
        // Auto-open first red clause
        const first = r.data.clauses?.find((c: Clause) => c.severity === "red");
        if (first) setOpen(first.id);
      })
      .catch((e) => {
        setError(e?.response?.data?.detail || t("Failed to load contract.", "Vertrag konnte nicht geladen werden."));
      })
      .finally(() => setLoading(false));
  }, [params?.id]);

  const counts = useMemo(() => ({
    red:    contract?.clauses.filter((c) => c.severity === "red").length    ?? 0,
    yellow: contract?.clauses.filter((c) => c.severity === "yellow").length ?? 0,
    green:  contract?.clauses.filter((c) => c.severity === "green").length  ?? 0,
  }), [contract]);

  const score = contract?.score ?? null;
  const list  = contract
    ? (filter === "all" ? contract.clauses : contract.clauses.filter((c) => c.severity === filter))
    : [];

  async function downloadPDF() {
    if (!contract) return;
    setDownloading(true);

    // ── Step 1: Try to download the server-generated PDF report ──
    try {
      const response = await api.get(`/contracts/${contract.id}/download-report/`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `LeaseLens_Report_${contract.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setDownloading(false);
      return;
    } catch {
      // Server report not ready (404) — fall through to client-side generation
    }

    // ── Step 2: Fallback — generate PDF client-side with jsPDF ──
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const PW = 210; // A4 width mm
      const MARGIN = 16;
      const CONTENT_W = PW - MARGIN * 2;
      let y = MARGIN;

      const SEV_COLORS: Record<Severity, [number, number, number]> = {
        red:    [220, 38, 38],
        yellow: [217, 119, 6],
        green:  [5, 150, 105],
      };
      const SEV_BG: Record<Severity, [number, number, number]> = {
        red:    [254, 242, 242],
        yellow: [255, 251, 235],
        green:  [236, 253, 245],
      };

      function checkPage(needed: number) {
        if (y + needed > 285) { doc.addPage(); y = MARGIN; }
      }

      function drawWrappedText(
        text: string,
        x: number,
        startY: number,
        maxW: number,
        lineH: number,
        fontSize: number,
        color: [number, number, number] = [30, 30, 30]
      ): number {
        doc.setFontSize(fontSize);
        doc.setTextColor(...color);
        const lines = doc.splitTextToSize(text, maxW);
        lines.forEach((line: string) => {
          checkPage(lineH);
          doc.text(line, x, y);
          y += lineH;
        });
        return y;
      }

      // ── Header banner ──
      doc.setFillColor(37, 99, 235);
      doc.roundedRect(MARGIN, y, CONTENT_W, 22, 3, 3, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("LeaseLens — Contract Analysis Report", MARGIN + 5, y + 9);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`, MARGIN + 5, y + 17);
      y += 28;

      // ── File name ──
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(`File: ${contract.original_filename}`, MARGIN, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Uploaded: ${new Date(contract.uploaded_at).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`, MARGIN, y);
      y += 10;

      // ── Score + summary boxes ──
      const boxW = (CONTENT_W - 6) / 4;
      const boxes = [
        { label: "Overall Score", value: `${score ?? "—"}/100`, color: score !== null ? (score >= 80 ? [5,150,105] : score >= 60 ? [217,119,6] : [220,38,38]) : [100,100,100] as [number,number,number], bg: [248,250,252] as [number,number,number] },
        { label: "Critical", value: String(counts.red),    color: [220,38,38]  as [number,number,number], bg: [254,242,242] as [number,number,number] },
        { label: "Review",   value: String(counts.yellow), color: [217,119,6]  as [number,number,number], bg: [255,251,235] as [number,number,number] },
        { label: "Good",     value: String(counts.green),  color: [5,150,105]  as [number,number,number], bg: [236,253,245] as [number,number,number] },
      ];
      boxes.forEach((b, i) => {
        const bx = MARGIN + i * (boxW + 2);
        doc.setFillColor(...(b.bg as [number,number,number]));
        doc.roundedRect(bx, y, boxW, 18, 2, 2, "F");
        doc.setTextColor(...(b.color as [number,number,number]));
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(b.value, bx + boxW / 2, y + 10, { align: "center" });
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);
        doc.text(b.label, bx + boxW / 2, y + 16, { align: "center" });
      });
      y += 24;

      // ── Section heading ──
      doc.setFillColor(243, 244, 246);
      doc.rect(MARGIN, y, CONTENT_W, 7, "F");
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Clause-by-Clause Analysis", MARGIN + 3, y + 5);
      y += 11;

      // ── Clauses ──
      contract.clauses.forEach((c, idx) => {
        const sevColor = SEV_COLORS[c.severity];
        const sevBg    = SEV_BG[c.severity];
        const sevLabel = c.severity === "red" ? "CRITICAL" : c.severity === "yellow" ? "REVIEW" : "GOOD";
        const expl     = de ? c.explanation_de    : c.explanation_en;
        const rec      = de ? c.recommendation_de : c.recommendation_en;
        const explLines  = doc.splitTextToSize(expl || "", CONTENT_W - 10);
        const recLines   = doc.splitTextToSize(rec  || "", CONTENT_W - 10);
        const origLines  = c.original_text ? doc.splitTextToSize(`"${c.original_text}"`, CONTENT_W - 10) : [];
        const cardH = 10 + (explLines.length + recLines.length + origLines.length) * 4.5 + 14;

        checkPage(Math.min(cardH, 60));

        // Card background
        doc.setFillColor(...sevBg);
        doc.roundedRect(MARGIN, y, CONTENT_W, 8, 1.5, 1.5, "F");

        // Severity pill
        doc.setFillColor(...sevColor);
        doc.roundedRect(MARGIN + 2, y + 1.5, 20, 5, 1, 1, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text(sevLabel, MARGIN + 12, y + 5.2, { align: "center" });

        // Clause number + category
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(9.5);
        doc.setFont("helvetica", "bold");
        const catLabel = `${idx + 1}. ${c.section ? c.section + "  " : ""}${c.category}`;
        doc.text(catLabel, MARGIN + 25, y + 5.5);
        y += 10;

        // Original text (quoted, smaller, italic)
        if (c.original_text) {
          doc.setFont("helvetica", "oblique");
          doc.setFontSize(7.5);
          doc.setTextColor(90, 90, 90);
          const oLines = doc.splitTextToSize(`"${c.original_text}"`, CONTENT_W - 6);
          oLines.slice(0, 3).forEach((line: string) => {
            checkPage(4.5);
            doc.text(line, MARGIN + 3, y);
            y += 4.5;
          });
          if (oLines.length > 3) { doc.text("…", MARGIN + 3, y); y += 4.5; }
          y += 1;
        }

        // What this means
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(60, 60, 60);
        checkPage(5);
        doc.text(de ? "Was es bedeutet:" : "What this means:", MARGIN + 3, y);
        y += 4.5;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(40, 40, 40);
        explLines.forEach((line: string) => { checkPage(4.5); doc.text(line, MARGIN + 3, y); y += 4.5; });
        y += 1;

        // Recommendation
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(...sevColor);
        checkPage(5);
        doc.text(de ? "Empfehlung:" : "Recommendation:", MARGIN + 3, y);
        y += 4.5;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(40, 40, 40);
        recLines.forEach((line: string) => { checkPage(4.5); doc.text(line, MARGIN + 3, y); y += 4.5; });

        // Divider
        y += 3;
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
        y += 4;
      });

      // ── Footer on every page ──
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const totalPages = (doc.internal as any).getNumberOfPages() as number;
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFontSize(7.5);
        doc.setTextColor(150, 150, 150);
        doc.text("LeaseLens · For informational purposes only · Not legal advice", MARGIN, 293);
        doc.text(`Page ${p} of ${totalPages}`, PW - MARGIN, 293, { align: "right" });
      }

      doc.save(`LeaseLens_${contract.original_filename.replace(/\.pdf$/i, "")}_Report.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  // ---- loading ----
  if (loading) return (
    <AppShell title={t("Loading…", "Wird geladen…")} subtitle="">
      <div className="flex items-center gap-3 text-sm text-ink-400">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink-300 border-t-brand-500" />
        {t("Fetching your analysis…", "Analyse wird geladen…")}
      </div>
    </AppShell>
  );

  // ---- error ----
  if (error) return (
    <AppShell title={t("Error", "Fehler")} subtitle="">
      <div className="rounded-xl border border-danger-200 bg-danger-50 p-6 text-danger-700">
        <p className="font-semibold">{error}</p>
        <p className="mt-2 text-sm">
          {t(
            "Make sure you have scanned the contract first.",
            "Stelle sicher, dass der Vertrag zuerst analysiert wurde."
          )}
        </p>
        <Link href="/scan" className="btn-primary mt-4">
          {t("Go to scanner", "Zum Scanner")}
        </Link>
      </div>
    </AppShell>
  );

  // ---- not scanned yet ----
  if (!contract?.clauses?.length) return (
    <AppShell
      title={t("Contract uploaded", "Vertrag hochgeladen")}
      subtitle={contract?.original_filename ?? ""}
    >
      <div className="card p-10 text-center">
        <p className="text-base font-semibold text-ink-800">
          {t(
            "This contract hasn't been scanned yet.",
            "Dieser Vertrag wurde noch nicht analysiert."
          )}
        </p>
        <p className="mt-2 text-sm text-ink-500">
          {t(
            'Go to the scanner and click "Analyse with Gemini" to run the analysis.',
            'Gehe zum Scanner und klicke auf "Mit Gemini analysieren".'
          )}
        </p>
        <Link href="/scan" className="btn-primary mt-5">
          {t("Scan now", "Jetzt analysieren")}
        </Link>
      </div>
    </AppShell>
  );

  return (
    <AppShell
      title={t("Contract analysis", "Vertragsanalyse")}
      subtitle={`${contract.original_filename} · ${new Date(contract.uploaded_at).toLocaleDateString(de ? "de-DE" : "en-GB", { day: "2-digit", month: "short", year: "numeric" })}`}
      actions={
        <button
          onClick={downloadPDF}
          disabled={downloading}
          className="btn-secondary hidden sm:inline-flex items-center gap-2"
        >
          {downloading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
          )}
          {downloading ? t("Generating…", "Wird erstellt…") : t("Download PDF", "PDF herunterladen")}
        </button>
      }
    >
      {/* ---- Summary row ---- */}
      <div>
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Score */}
        <div className="card relative overflow-hidden p-7">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-brand-100/50 blur-2xl" />
          <span className="label">{t("Overall score", "Gesamt-Score")}</span>
          <div className="relative mt-4 flex items-center gap-5">
            {score !== null ? (
              <>
                <Ring value={score} />
                <div>
                  <p className="text-4xl font-extrabold tracking-tight">
                    {score}
                    <span className="text-base text-ink-400">/100</span>
                  </p>
                  <p className="mt-1 text-sm text-ink-500">
                    {score >= 80
                      ? t("Looks fair overall.", "Insgesamt fair.")
                      : score >= 60
                      ? t("A few issues — read on.", "Einige Punkte zu prüfen.")
                      : t("Several risky clauses.", "Mehrere riskante Klauseln.")}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-ink-500">{t("Score not available.", "Score nicht verfügbar.")}</p>
            )}
          </div>
        </div>

        {/* Counts */}
        {(["red", "yellow", "green"] as Severity[]).map((s) => {
          const m = SEV[s];
          return (
            <div key={s} className={`card overflow-hidden border p-7 ${m.ring}`}>
              <div className="flex items-center justify-between">
                <span className={m.chip}>{de ? m.label.de : m.label.en}</span>
                <span className="text-3xl font-extrabold text-ink-900">{counts[s]}</span>
              </div>
              <p className="mt-3 text-sm text-ink-600">
                {s === "red"    && t("Likely void or risky — act now.",          "Wahrscheinlich unwirksam — handeln.")}
                {s === "yellow" && t("Worth checking with your landlord.",        "Mit Vermieter klären.")}
                {s === "green"  && t("Standard, fair clauses. No action needed.", "Standard. Keine Aktion nötig.")}
              </p>
            </div>
          );
        })}
      </div>

      {/* ---- Clause list ---- */}
      <div className="mt-8 card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title">{t("Clause-by-clause", "Klausel für Klausel")}</h2>
          <div className="flex gap-1 rounded-xl border border-ink-200 bg-white p-1 text-xs">
            {(["all", "red", "yellow", "green"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                  filter === f ? "bg-brand-600 text-white" : "text-ink-500 hover:text-ink-900"
                }`}
              >
                {f === "all"    ? t("All", "Alle")
                : f === "red"   ? (de ? "Kritisch" : "Critical")
                : f === "yellow"? (de ? "Prüfen"   : "Review")
                :                 (de ? "OK"        : "Good")}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 divide-y divide-ink-100">
          {list.length === 0 && (
            <p className="py-6 text-center text-sm text-ink-400">
              {t("No clauses match this filter.", "Keine Klauseln für diesen Filter.")}
            </p>
          )}
          {list.map((c) => {
            const m = SEV[c.severity];
            const isOpen = open === c.id;
            return (
              <div key={c.id} className="py-3">
                <button
                  onClick={() => setOpen(isOpen ? null : c.id)}
                  className="flex w-full items-center gap-4 rounded-xl px-2 py-3 text-left transition hover:bg-ink-50"
                >
                  <span className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${m.dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {c.section && (
                        <span className="text-xs font-semibold text-ink-400">{c.section}</span>
                      )}
                      <p className="truncate text-sm font-semibold text-ink-900">{c.category}</p>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-ink-500">
                      {de ? c.explanation_de : c.explanation_en}
                    </p>
                  </div>
                  <span className={m.chip}>{de ? m.label.de : m.label.en}</span>
                  <svg
                    className={`h-4 w-4 text-ink-400 transition ${isOpen ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="ml-7 mt-2 animate-fade-in space-y-4 rounded-xl border border-ink-100 bg-surface-muted p-5 text-sm">
                    {c.original_text && (
                      <div>
                        <p className="label">{t("Contract text", "Vertragstext")}</p>
                        <p className="mt-1 rounded-xl border border-ink-100 bg-white px-4 py-3 font-mono text-xs leading-relaxed text-ink-700">
                          {c.original_text}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="label">{t("What this means", "Was es bedeutet")}</p>
                      <p className="mt-1 text-ink-600">{de ? c.explanation_de : c.explanation_en}</p>
                    </div>
                    <div>
                      <p className="label">{t("Our recommendation", "Empfehlung")}</p>
                      <p className="mt-1 text-ink-600">{de ? c.recommendation_de : c.recommendation_en}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-6 text-xs text-ink-400">
        {t(
          "LeaseLens provides general information, not legal advice. For binding advice contact a Mieterverein or a lawyer.",
          "LeaseLens bietet allgemeine Informationen, keine Rechtsberatung. Für verbindlichen Rat: Mieterverein oder Anwalt."
        )}
      </p>
      </div>{/* end reportRef */}
    </AppShell>
  );
}

function Ring({ value }: { value: number }) {
  const r = 36, c = 2 * Math.PI * r, off = c - (value / 100) * c;
  const color = value >= 80 ? "#10b981" : value >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
      <circle cx="48" cy="48" r={r} stroke="#eef0f6" strokeWidth="10" fill="none" />
      <circle cx="48" cy="48" r={r} stroke={color} strokeWidth="10" fill="none"
        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" />
    </svg>
  );
}
