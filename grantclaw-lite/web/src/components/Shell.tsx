import { PropsWithChildren, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { chainConfig, contractLink, fetchChainStatus, shortAddress, type ChainStatus } from "../lib/chainStatus";

const nav = [
  { to: "/generate", label: "Generate" },
  { to: "/preview", label: "Preview" },
  { to: "/submit", label: "Submit" },
  { to: "/feed", label: "Feed" }
];

const THEME_STORAGE_KEY = "grantclaw-theme";

function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextDark = saved ? saved === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", nextDark);
    setIsDark(nextDark);
  }, []);

  function toggleTheme() {
    const nextDark = !isDark;
    setIsDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
    localStorage.setItem(THEME_STORAGE_KEY, nextDark ? "dark" : "light");
  }

  return (
    <button
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="gc-btn-secondary px-3"
      onClick={toggleTheme}
      type="button"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="text-base" role="img" aria-hidden="true">
        {isDark ? "☀️" : "🌙"}
      </span>
    </button>
  );
}

function NetworkBadge() {
  const { rpc, registryAddress } = chainConfig();
  const configured = typeof rpc === "string" && typeof registryAddress === "string";
  const [status, setStatus] = useState<ChainStatus>({ ok: false, error: "Checking" });

  useEffect(() => {
    if (!configured) {
      return;
    }

    let active = true;

    async function refresh() {
      const next = await fetchChainStatus(2000);
      if (active) {
        setStatus(next);
      }
    }

    void refresh();
    const interval = setInterval(() => {
      void refresh();
    }, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [configured]);

  if (!configured) {
    return (
      <div className="rounded-xl border border-amber-100 bg-amber-50/80 px-3 py-2 text-xs text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
        <p className="font-medium">BSC Testnet</p>
        <p>Not configured</p>
      </div>
    );
  }

  const configuredRegistryAddress = registryAddress as string;

  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
      <p className="font-semibold text-slate-700 dark:text-slate-200">BSC Testnet</p>
      <p className="text-slate-600 dark:text-slate-300">
        Contract:{" "}
        <a className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200" href={contractLink(configuredRegistryAddress)} rel="noreferrer" target="_blank">
          {shortAddress(configuredRegistryAddress)}
        </a>
      </p>
      <p className={status.ok ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>{status.ok ? `Healthy${typeof status.block === "number" ? ` · #${status.block}` : ""}` : "Error"}</p>
    </div>
  );
}

export function Shell({ children }: PropsWithChildren) {
  const location = useLocation();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-white/70 bg-white/65 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/65">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">GrantClaw Lite</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Transparent grant operations on BSC testnet</p>
          </div>
          <div className="flex items-center gap-3">
            <nav className="flex gap-2 rounded-xl border border-white/70 bg-white/80 p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
              {nav.map((item) => (
                <Link
                  className={`rounded-lg px-3 py-2 text-sm transition ${location.pathname.startsWith(item.to) ? "bg-slate-900 text-white shadow dark:bg-indigo-500" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}
                  key={item.to}
                  to={item.to}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <ThemeToggle />
            <NetworkBadge />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4 md:p-6">{children}</main>
    </div>
  );
}
