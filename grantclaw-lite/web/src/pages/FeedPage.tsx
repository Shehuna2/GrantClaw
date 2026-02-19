// ===============================
// Path: web/src/pages/FeedPage.tsx
// Patch to show friendly retry message
// ===============================
import { useEffect, useState } from "react";
import { fetchProposalEvents, RateLimitError, type ProposalEvent, txLink } from "../lib/chain";


export default function FeedPage() {
  const [items, setItems] = useState<ProposalEvent[]>([]);
  const [busy, setBusy] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setBusy(true);
      setErr(null);
      setNotice(null);

      const events = await fetchProposalEvents();
      setItems(events);
    } catch (e: any) {
      if (e instanceof RateLimitError) {
        setNotice("RPC rate-limited while loading feed. Retrying automatically…");
        setTimeout(() => void load(), e.retryAfterMs);
        return;
      }
      setErr(e?.message ?? "Failed to load feed");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Proposal Feed</h2>

      {notice ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm">
          {notice}
        </div>
      ) : null}

      {err ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
          {err}
        </div>
      ) : null}

      <button
        onClick={() => void load()}
        className="mb-4 px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        disabled={busy}
      >
        {busy ? "Loading…" : "Refresh"}
      </button>

      <div className="space-y-3">
        {items.map((e) => (
          <div key={`${e.proposalHash}:${e.blockNumber}`} className="rounded-lg border p-4">
            <div className="font-semibold">{e.title}</div>
            <div className="text-sm text-gray-600">Grant: {e.grantId}</div>
            <div className="text-xs break-all mt-2">Hash: {e.proposalHash}</div>
            <div className="text-xs break-all">Submitter: {e.submitter}</div>
            <div className="mt-2 flex gap-3 text-sm">
              <a className="underline" href={txLink(e.txHash)} target="_blank" rel="noreferrer">
                Tx
              </a>
              <a className="underline" href={`/p/${e.proposalHash}`}>
                Open
              </a>
            </div>
          </div>
        ))}
        {!busy && items.length === 0 ? (
          <div className="text-sm text-gray-600">No proposals found yet.</div>
        ) : null}
      </div>
    </div>
  );
}
