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
      <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
        <p className="font-medium">BSC Testnet</p>
        <p>Not configured</p>
      </div>
    );
  }

  const configuredRegistryAddress = registryAddress as string;

  return (
    <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
      <p className="font-medium">BSC Testnet</p>
      <p>
        Contract:{" "}
        <a className="text-blue-700 underline" href={contractLink(configuredRegistryAddress)} rel="noreferrer" target="_blank">
          {shortAddress(configuredRegistryAddress)}
        </a>
      </p>
      <p className={status.ok ? "text-emerald-700" : "text-red-600"}>{status.ok ? `OK${typeof status.block === "number" ? ` · #${status.block}` : ""}` : "Error"}</p>
    </div>
  );
}

export function Shell({ children }: PropsWithChildren) {
  const location = useLocation();

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4">
          <h1 className="text-xl font-semibold">GrantClaw Lite</h1>
          <div className="flex items-center gap-3">
            <nav className="flex gap-2">
              {nav.map((item) => (
                <Link
                  className={`rounded-md px-3 py-2 text-sm ${location.pathname.startsWith(item.to) ? "bg-slate-900 text-white" : "bg-slate-100"}`}
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
      <main className="mx-auto max-w-5xl p-4">{children}</main>
    </div>
  );
}
