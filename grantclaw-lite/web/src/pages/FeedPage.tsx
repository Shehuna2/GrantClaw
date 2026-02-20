import { useEffect, useState } from "react";
import { Card } from "../components/Card";
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
    <Card>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold tracking-tight">Proposal Feed</h2>
        <button onClick={() => void load()} className="gc-btn-secondary" disabled={busy}>
          {busy ? "Loading…" : "Refresh"}
        </button>
      </div>

      {notice ? <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{notice}</div> : null}
      {err ? <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{err}</div> : null}

      <div className="space-y-3">
        {items.map((e) => (
          <div key={`${e.proposalHash}:${e.blockNumber}`} className="rounded-xl border border-slate-200 bg-white/70 p-4">
            <div className="font-semibold">{e.title}</div>
            <div className="text-sm text-slate-600">Grant: {e.grantId}</div>
            <div className="mt-2 break-all text-xs text-slate-500">Hash: {e.proposalHash}</div>
            <div className="break-all text-xs text-slate-500">Submitter: {e.submitter}</div>
            <div className="mt-2 flex gap-3 text-sm">
              <a className="font-medium text-indigo-600 underline" href={txLink(e.txHash)} target="_blank" rel="noreferrer">
                Tx
              </a>
              <a className="font-medium text-indigo-600 underline" href={`/p/${e.proposalHash}`}>
                Open
              </a>
            </div>
          </div>
        ))}
        {!busy && items.length === 0 ? <div className="text-sm text-slate-600">No proposals found yet.</div> : null}
      </div>
    </Card>
  );
}
