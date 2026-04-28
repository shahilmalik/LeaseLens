"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { useAuthStore } from "@/lib/store";

type Result = {
  fairLow: number;
  fairMid: number;
  fairHigh: number;
  cap: number;
  perSqm: number;
  verdict: "fair" | "high" | "illegal";
};

export default function RentCheckPage() {
  const { language } = useAuthStore();
  const de = language === "de";
  const t = (en: string, deStr: string) => (de ? deStr : en);

  const [form, setForm] = useState({
    address: "",
    district: "Mitte",
    sqm: 45,
    rooms: 2,
    coldRent: 720,
    yearBuilt: 1995,
  });
  const [result, setResult] = useState<Result | null>(null);

  function calc() {
    // Toy heuristic — replaceable by real backend Mietspiegel call.
    const base =
      form.yearBuilt >= 2015 ? 14.5 :
      form.yearBuilt >= 2000 ? 12.5 :
      form.yearBuilt >= 1980 ? 11.0 :
      form.yearBuilt >= 1960 ?  9.8 : 9.2;
    const districtAdj: Record<string, number> = {
      "Mitte": 1.20, "West": 1.10, "Süd": 1.05, "Nord": 1.00, "Ost": 0.95, "Vaihingen": 0.92, "Bad Cannstatt": 0.90,
    };
    const adj = districtAdj[form.district] ?? 1.0;
    const mid = base * adj;
    const fairLow = +(mid * 0.85).toFixed(2);
    const fairHigh = +(mid * 1.15).toFixed(2);
    const cap = +(mid * 1.10).toFixed(2);
    const perSqm = +(form.coldRent / Math.max(1, form.sqm)).toFixed(2);
    const verdict: Result["verdict"] =
      perSqm <= cap * 1.0 ? "fair" :
      perSqm <= cap * 1.10 ? "high" : "illegal";
    setResult({ fairLow, fairMid: +mid.toFixed(2), fairHigh, cap, perSqm, verdict });
  }

  return (
    <AppShell
      title={t("Rent price check", "Mietpreis-Check")}
      subtitle={t("Compare your rent against the Stuttgarter Mietspiegel.", "Vergleiche deine Miete mit dem Stuttgarter Mietspiegel.")}
    >
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Form */}
        <div className="card p-7 lg:col-span-2">
          <h2 className="section-title">{t("Your apartment", "Deine Wohnung")}</h2>
          <p className="muted mt-1">{t("Quick estimate based on Mietspiegel benchmarks.", "Schätzung anhand des Mietspiegels.")}</p>
          <div className="mt-5 grid gap-4">
            <Field label={t("Address", "Adresse")}>
              <input className="input" value={form.address} placeholder="Königstraße 1" onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("District", "Stadtteil")}>
                <select className="input" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}>
                  {["Mitte","West","Süd","Nord","Ost","Vaihingen","Bad Cannstatt"].map((d) => <option key={d}>{d}</option>)}
                </select>
              </Field>
              <Field label={t("Year built", "Baujahr")}>
                <input type="number" className="input" value={form.yearBuilt} onChange={(e) => setForm({ ...form, yearBuilt: +e.target.value })} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("Size (m²)", "Größe (m²)")}>
                <input type="number" className="input" value={form.sqm} onChange={(e) => setForm({ ...form, sqm: +e.target.value })} />
              </Field>
              <Field label={t("Rooms", "Zimmer")}>
                <input type="number" step="0.5" className="input" value={form.rooms} onChange={(e) => setForm({ ...form, rooms: +e.target.value })} />
              </Field>
            </div>
            <Field label={t("Cold rent (€ / month)", "Kaltmiete (€ / Monat)")}>
              <input type="number" className="input" value={form.coldRent} onChange={(e) => setForm({ ...form, coldRent: +e.target.value })} />
            </Field>
            <button onClick={calc} className="btn-primary mt-2">
              {t("Check fairness", "Miete prüfen")}
            </button>
          </div>
        </div>

        {/* Result */}
        <div className="lg:col-span-3">
          {!result ? (
            <div className="card flex h-full min-h-[300px] flex-col items-center justify-center p-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V5m0 14h16M8 16V10m4 6V7m4 9v-4"/></svg>
              </div>
              <p className="mt-4 text-base font-semibold">{t("Enter your details to see the benchmark.", "Gib deine Daten ein, um den Vergleich zu sehen.")}</p>
              <p className="mt-1 text-sm text-ink-500 max-w-sm">
                {t("We compute a fair-rent range and check the 10% Mietpreisbremse cap.",
                   "Wir berechnen die faire Spanne und prüfen die 10 %-Mietpreisbremse.")}
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div className={`card overflow-hidden p-7 border-2 ${
                result.verdict === "fair" ? "border-success-200" :
                result.verdict === "high" ? "border-warning-200" : "border-danger-300"}`}>
                <div className="flex items-center justify-between">
                  <span className="label">{t("Verdict", "Bewertung")}</span>
                  <span className={
                    result.verdict === "fair" ? "chip-success" :
                    result.verdict === "high" ? "chip-warning" : "chip-danger"}>
                    {result.verdict === "fair"   ? t("Fair", "Fair")
                     : result.verdict === "high" ? t("Slightly above benchmark", "Etwas über Benchmark")
                     : t("Likely violates Mietpreisbremse", "Wohl Verstoß gegen Mietpreisbremse")}
                  </span>
                </div>
                <div className="mt-5 grid gap-5 sm:grid-cols-3">
                  <Stat label={t("Your rent / m²", "Deine Miete / m²")} value={`€ ${result.perSqm}`} />
                  <Stat label={t("Mietspiegel mid", "Mietspiegel Mitte")}  value={`€ ${result.fairMid}`} />
                  <Stat label={t("Legal cap (+10%)", "Gesetzlicher Deckel (+10 %)")} value={`€ ${result.cap}`} />
                </div>

                {/* Chart */}
                <RangeChart low={result.fairLow} mid={result.fairMid} high={result.fairHigh} cap={result.cap} actual={result.perSqm} />
              </div>

              <div className="card p-6">
                <h3 className="section-title">{t("What this means", "Was das bedeutet")}</h3>
                <p className="mt-2 text-sm text-ink-600">
                  {result.verdict === "fair"
                    ? t("Your rent looks fair compared to similar apartments. Keep this report for future reference.",
                         "Deine Miete ist im Vergleich fair. Bewahre diesen Bericht auf.")
                    : result.verdict === "high"
                    ? t("Your rent is slightly above the local benchmark. Worth a polite negotiation.",
                         "Etwas über Benchmark — eine Verhandlung könnte sich lohnen.")
                    : t("Your rent likely exceeds the 10% Mietpreisbremse cap. You can formally object — see deadlines.",
                         "Wahrscheinlich über dem 10 %-Deckel. Förmlicher Widerspruch möglich — siehe Fristen.")}
                </p>
              </div>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-muted p-4">
      <p className="text-xs uppercase tracking-wider text-ink-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-ink-900">{value}</p>
    </div>
  );
}

function RangeChart({ low, mid, high, cap, actual }: { low: number; mid: number; high: number; cap: number; actual: number }) {
  const min = Math.min(low, actual) * 0.85;
  const max = Math.max(high, cap, actual) * 1.05;
  const span = max - min || 1;
  const pct = (v: number) => ((v - min) / span) * 100;
  return (
    <div className="mt-7">
      <div className="relative h-12">
        {/* fair band */}
        <div className="absolute top-1/2 -translate-y-1/2 h-3 rounded-full bg-success-100"
             style={{ left: `${pct(low)}%`, width: `${pct(high) - pct(low)}%` }} />
        {/* cap line */}
        <div className="absolute top-0 h-12 border-l-2 border-dashed border-warning-500"
             style={{ left: `${pct(cap)}%` }} />
        {/* mid */}
        <div className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded bg-success-600"
             style={{ left: `${pct(mid)}%` }} />
        {/* actual marker */}
        <div className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-brand-600 shadow-pop"
             style={{ left: `${pct(actual)}%` }} />
      </div>
      <div className="mt-3 flex justify-between text-xs text-ink-500">
        <span>€ {low}</span>
        <span>€ {high}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded bg-success-100"/>Fair range</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 border-l-2 border-dashed border-warning-500"/>+10 % cap</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand-600"/>Your rent</span>
      </div>
    </div>
  );
}
