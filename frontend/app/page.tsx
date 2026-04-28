import Link from "next/link";

const FEATURES = [
  {
    title: "Clause Scanner",
    desc: "Every clause classified Critical, Review or Good — with plain-language explanations of what's actually enforceable.",
    accent: "from-brand-500 to-brand-700",
    icon: (
      <path d="M9 11h6M9 15h4M7 5h10a2 2 0 0 1 2 2v12.5L15.5 17H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
    ),
  },
  {
    title: "Mietpreisbremse Check",
    desc: "Compare your rent against the Stuttgarter Mietspiegel and instantly see if your landlord is overcharging.",
    accent: "from-emerald-500 to-emerald-700",
    icon: <path d="M4 19V5m0 14h16M8 16V10m4 6V7m4 9v-4" />,
  },
  {
    title: "AI Housing Advisor",
    desc: "Ask anything in English or German. Get answers grounded in your actual contract — not generic templates.",
    accent: "from-fuchsia-500 to-purple-700",
    icon: <path d="M21 12a8 8 0 1 1-3.1-6.3L21 4l-1.3 3.6A8 8 0 0 1 21 12Z" />,
  },
  {
    title: "Deadline Tracker",
    desc: "Never miss a Kündigungsfrist again. Notice periods, deposit return, utility objections — all in one place.",
    accent: "from-amber-500 to-orange-600",
    icon: <path d="M12 8v4l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  },
];

const STATS = [
  { value: "180+", label: "clauses checked per contract" },
  { value: "92 %",  label: "of leases contain at least one void clause" },
  { value: "10 %",  label: "max rent surcharge under Mietpreisbremse" },
  { value: "<60 s", label: "average time to full analysis" },
];

const STEPS = [
  { n: "01", title: "Upload your contract", desc: "Drop the PDF — we extract every clause securely on our servers." },
  { n: "02", title: "We analyse it",        desc: "Each clause is benchmarked against German tenancy law and BGH rulings." },
  { n: "03", title: "You stay in control",  desc: "Read the full report, ask follow-ups, and take action with confidence." },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-surface-muted text-ink-900">
      {/* Nav */}
      <nav className="sticky top-0 z-30 border-b border-ink-100/70 bg-white/75 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-pop">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="6" />
                <path d="m20 20-4.3-4.3" />
              </svg>
            </span>
            <span className="text-[17px] font-bold tracking-tight">
              Lease<span className="text-brand-600">Lens</span>
            </span>
          </Link>
          <div className="hidden items-center gap-8 text-sm text-ink-600 md:flex">
            <a href="#features" className="hover:text-ink-900">Features</a>
            <a href="#how"      className="hover:text-ink-900">How it works</a>
            <a href="#trust"    className="hover:text-ink-900">Why us</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login?mode=login" className="btn-ghost">Sign in</Link>
            <Link href="/login?mode=register" className="btn-primary">Get started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-brand-500/15 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="mx-auto max-w-3xl text-center">
            <span className="chip-info animate-fade-in">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              Built for international students in Stuttgart
            </span>
            <h1 className="mt-6 text-balance text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl">
              Read your German lease{" "}
              <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-fuchsia-500 bg-clip-text text-transparent">
                like a local
              </span>
              .
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-500">
              Upload your Mietvertrag and LeaseLens flags illegal clauses, checks if your rent is fair, and answers every question — in plain English.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link href="/login?mode=register" className="btn-primary px-6 py-3 text-base">
                Upload my contract
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
              </Link>
              <Link href="/login?mode=register" className="btn-secondary px-6 py-3 text-base">
                Check my rent
              </Link>
            </div>
            <p className="mt-4 text-xs text-ink-400">Free to try · No credit card · GDPR-friendly</p>
          </div>

          {/* Hero preview card */}
          <div className="mx-auto mt-16 max-w-5xl animate-scale-in">
            <div className="card overflow-hidden p-0">
              <div className="flex items-center justify-between border-b border-ink-100 px-6 py-3 text-xs text-ink-500">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-danger-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-warning-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-success-400/70" />
                </div>
                <span className="font-medium">Mietvertrag_Stuttgart.pdf — analysis</span>
                <span className="chip-success">Score 78/100</span>
              </div>
              <div className="grid gap-6 p-6 md:grid-cols-3">
                {[
                  { tone: "danger",  label: "Critical", count: 2, note: "Cosmetic repairs · Index rent step-up" },
                  { tone: "warning", label: "Review",   count: 5, note: "Operating costs · Pet policy · …" },
                  { tone: "success", label: "Good",     count: 12, note: "Deposit, term, notice period…" },
                ].map((b) => (
                  <div key={b.label} className={`rounded-2xl border p-5 ${
                    b.tone === "danger"  ? "border-danger-100 bg-danger-50"  :
                    b.tone === "warning" ? "border-warning-100 bg-warning-50":
                                           "border-success-100 bg-success-50"}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${
                        b.tone === "danger"  ? "text-danger-700"  :
                        b.tone === "warning" ? "text-warning-700" : "text-success-700"}`}>{b.label}</span>
                      <span className="text-2xl font-bold text-ink-900">{b.count}</span>
                    </div>
                    <p className="mt-2 text-xs text-ink-500">{b.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-ink-100 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-8 px-6 py-12 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-extrabold tracking-tight text-ink-900 md:text-4xl">{s.value}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-ink-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-2xl">
          <span className="label">What you get</span>
          <h2 className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">
            Everything you need before you sign.
          </h2>
          <p className="mt-4 text-ink-500">
            LeaseLens combines clause-level legal review, rent benchmarking and a contract-aware AI assistant — all in one place.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="card-hover p-7">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${f.accent} text-white shadow-pop`}>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{f.icon}</svg>
              </div>
              <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="max-w-2xl">
            <span className="label">How it works</span>
            <h2 className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">Three steps, sixty seconds.</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-ink-100 bg-surface-muted p-7">
                <span className="text-sm font-bold tracking-widest text-brand-600">{s.n}</span>
                <h3 className="mt-3 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section id="trust" className="mx-auto max-w-7xl px-6 py-24">
        <div className="card overflow-hidden">
          <div className="grid items-center gap-10 p-10 md:grid-cols-2 md:p-14">
            <div>
              <span className="label">Why LeaseLens</span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                We focus on one city, one audience — and do it properly.
              </h2>
              <ul className="mt-6 space-y-3 text-sm text-ink-600">
                {[
                  "Backed by the Stuttgarter Mietspiegel & current BGH case law",
                  "End-to-end encrypted uploads, deletable any time",
                  "Bilingual UI in English and German — built for newcomers",
                  "No legal jargon. Real explanations. Real next steps.",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-success-100 text-success-700">
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-11"/></svg>
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex gap-3">
                <Link href="/login?mode=register" className="btn-primary">Start free analysis</Link>
                <Link href="/login?mode=login" className="btn-secondary">I have an account</Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-brand-500/15 via-fuchsia-500/10 to-emerald-500/10 blur-2xl" />
              <div className="relative rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
                <p className="text-xs uppercase tracking-wider text-ink-400">Sample insight</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-700">
                  <strong>§ 12 Schönheitsreparaturen:</strong> Your contract sets fixed renovation deadlines.
                  Per BGH VIII ZR 178/05 these clauses are <span className="font-semibold text-danger-700">void</span>.
                  You're <em>not</em> obliged to repaint when moving out.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="chip-danger">Critical</span>
                  <span className="chip-muted">§ 12 · Renovation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center text-white">
          <h2 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            Don't sign blind. Sign smart.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-brand-100">
            Join hundreds of students in Stuttgart taking the guesswork out of German rental contracts.
          </p>
          <Link href="/login?mode=register" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-base font-semibold text-brand-700 shadow-pop transition hover:bg-brand-50">
            Analyse my contract — free
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
          </Link>
        </div>
      </section>

      <footer className="border-t border-ink-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-xs text-ink-500">
          <span>© 2026 LeaseLens — Made in Stuttgart 🇩🇪</span>
          <span>Not legal advice. We surface signals — you make the call.</span>
        </div>
      </footer>
    </main>
  );
}
