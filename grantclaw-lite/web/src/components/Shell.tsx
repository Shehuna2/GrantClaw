import { PropsWithChildren, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { chainConfig, contractLink, fetchChainStatus, shortAddress, type ChainStatus } from "../lib/chainStatus";

const nav = [
  { to: "/generate", label: "Generate" },
  { to: "/preview", label: "Preview" },
  { to: "/submit", label: "Submit" },
  { to: "/feed", label: "Feed" }
];

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
      <div className="rounded-xl border border-amber-100 bg-amber-50/80 px-3 py-2 text-xs text-amber-700">
        <p className="font-medium">BSC Testnet</p>
        <p>Not configured</p>
      </div>
    );
  }

  const configuredRegistryAddress = registryAddress as string;

  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs shadow-sm backdrop-blur">
      <p className="font-semibold text-slate-700">BSC Testnet</p>
      <p className="text-slate-600">
        Contract:{" "}
        <a className="font-medium text-indigo-600 hover:text-indigo-500" href={contractLink(configuredRegistryAddress)} rel="noreferrer" target="_blank">
          {shortAddress(configuredRegistryAddress)}
        </a>
      </p>
      <p className={status.ok ? "text-emerald-600" : "text-rose-600"}>{status.ok ? `Healthy${typeof status.block === "number" ? ` · #${status.block}` : ""}` : "Error"}</p>
    </div>
  );
}

export function Shell({ children }: PropsWithChildren) {
  const location = useLocation();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-white/70 bg-white/65 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">GrantClaw Lite</h1>
            <p className="text-xs text-slate-500">Transparent grant operations on BSC testnet</p>
          </div>
          <div className="flex items-center gap-3">
            <nav className="flex gap-2 rounded-xl border border-white/70 bg-white/80 p-1 shadow-sm">
              {nav.map((item) => (
                <Link
                  className={`rounded-lg px-3 py-2 text-sm transition ${location.pathname.startsWith(item.to) ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:bg-slate-100"}`}
                  key={item.to}
                  to={item.to}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <NetworkBadge />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4 md:p-6">{children}</main>
    </div>
  );
}
