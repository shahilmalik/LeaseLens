"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { LANGUAGES, makeTFn, isRTL, type LangCode } from "@/lib/i18n";

type NavItem = { href: string; labelKey: string; icon: ReactNode };

const NAV: NavItem[] = [
  { href: "/dashboard",  labelKey: "Dashboard",    icon: <IconHome /> },
  { href: "/scan",       labelKey: "Scan Contract", icon: <IconScan /> },
  { href: "/rent-check", labelKey: "Rent Check",    icon: <IconChart /> },
  { href: "/assistant",  labelKey: "AI Assistant",  icon: <IconChat /> },
  { href: "/deadlines",  labelKey: "Deadlines",     icon: <IconClock /> },
  { href: "/profile",    labelKey: "Profile",       icon: <IconUser /> },
];

export default function AppShell({ children, title, subtitle, actions }: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, language, logout, _hasHydrated, setLanguage } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const t = makeTFn(language as LangCode);
  const currentLang = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  // Close lang dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) router.replace("/login");
  }, [_hasHydrated, user, router]);

  // Apply RTL direction to <html> when needed
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dir = isRTL(language as LangCode) ? "rtl" : "ltr";
    }
  }, [language]);

  if (!_hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-400">
        Loading…
      </div>
    );
  }
  if (!user) return null;

  const initials =
    (user.first_name?.[0] || user.username?.[0] || "?").toUpperCase() +
    (user.last_name?.[0] || "").toUpperCase();

  return (
    <div className="min-h-screen bg-surface-muted">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-ink-100 bg-white transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-ink-100 px-6">
          <Logo />
        </div>

        <nav className="flex flex-col gap-1 p-4">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
                }`}
              >
                <span className={active ? "text-brand-600" : "text-ink-400 group-hover:text-ink-600"}>
                  {item.icon}
                </span>
                {t(item.labelKey as Parameters<typeof t>[0])}
              </Link>
            );
          })}
        </nav>

        <div className="absolute inset-x-4 bottom-4">
          <div className="rounded-2xl border border-ink-100 bg-surface-muted p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900">
                  {user.first_name || user.username}
                </p>
                <p className="truncate text-xs text-ink-500">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => { logout(); router.push("/"); }}
              className="mt-3 w-full rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50"
            >
              {t("Sign out")}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-ink-900/30 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-ink-100 bg-white/80 backdrop-blur-md">
          <div className="flex h-16 items-center gap-4 px-5 sm:px-8">
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 lg:hidden"
              aria-label="Open menu"
            >
              <IconMenu />
            </button>

            <div className="min-w-0 flex-1">
              {title && <h1 className="truncate text-base font-semibold text-ink-900 sm:text-lg">{title}</h1>}
              {subtitle && <p className="truncate text-xs text-ink-500">{subtitle}</p>}
            </div>

            <div className="flex items-center gap-2">
              {/* ── Language picker dropdown ── */}
              <div className="relative hidden sm:block" ref={langRef}>
                <button
                  onClick={() => setLangOpen((v) => !v)}
                  className="flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50 transition"
                >
                  <span>{currentLang.flag}</span>
                  <span>{currentLang.native}</span>
                  <svg viewBox="0 0 24 24" className="h-3 w-3 text-ink-400" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
                </button>

                {langOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-2xl border border-ink-100 bg-white shadow-xl overflow-hidden">
                    <div className="max-h-80 overflow-y-auto p-1.5">
                      {LANGUAGES.map((l) => {
                        const active = language === l.code;
                        return (
                          <button
                            key={l.code}
                            onClick={() => {
                              setLanguage(l.code as LangCode);
                              setLangOpen(false);
                              try { fetch("/api/v1/profile/", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language: l.code }) }); } catch {}
                            }}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                              active ? "bg-brand-50 text-brand-700 font-semibold" : "text-ink-700 hover:bg-ink-50"
                            }`}
                          >
                            <span className="text-lg">{l.flag}</span>
                            <span className="flex-1 text-left">{l.native}</span>
                            {active && <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 13 4 4L19 7"/></svg>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              {actions}
            </div>
          </div>
        </header>

        <main className="px-5 py-8 sm:px-8 sm:py-10">{children}</main>
      </div>
    </div>
  );
}

export function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-pop">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="6" />
          <path d="m20 20-4.3-4.3" />
        </svg>
      </span>
      <span className="text-[17px] font-bold tracking-tight text-ink-900">
        Lease<span className="text-brand-600">Lens</span>
      </span>
    </Link>
  );
}

/* --- Icons --- */
function IconHome()  { return <Svg d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z"/>; }
function IconScan()  { return <Svg d="M4 7V5a1 1 0 0 1 1-1h2M20 7V5a1 1 0 0 0-1-1h-2M4 17v2a1 1 0 0 0 1 1h2m13-3v2a1 1 0 0 1-1 1h-2M3 12h18"/>; }
function IconChart() { return <Svg d="M4 19V5m0 14h16M8 16V10m4 6V7m4 9v-4"/>; }
function IconChat()  { return <Svg d="M21 12a8 8 0 1 1-3.1-6.3L21 4l-1.3 3.6A8 8 0 0 1 21 12Z"/>; }
function IconClock() { return <Svg d="M12 8v4l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>; }
function IconUser()  { return <Svg d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm4 9a8 8 0 0 0-16 0"/>; }
function IconMenu()  { return <Svg d="M4 6h16M4 12h16M4 18h16"/>; }

function Svg({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
