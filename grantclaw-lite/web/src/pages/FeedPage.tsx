import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/Card";
import { fetchProposalEvents, ProposalEvent } from "../lib/chain";

export function FeedPage() {
  const [items, setItems] = useState<ProposalEvent[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProposalEvents().then(setItems).catch((err) => setError((err as Error).message));
  }, []);

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold">Proposal Feed</h2>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <div className="space-y-3">
        {items.map((item) => (
          <Link className="block rounded border p-3 hover:bg-slate-50" key={`${item.proposalHash}-${item.blockNumber}`} to={`/p/${item.proposalHash}`}>
            <p className="font-medium">{item.title}</p>
            <p className="text-xs text-slate-600">{item.grantId}</p>
            <p className="truncate text-xs text-slate-500">{item.proposalHash}</p>
          </Link>
        ))}
        {items.length === 0 && !error && <p className="text-sm text-slate-500">No proposals found in lookback window.</p>}
      </div>
    </Card>
  );
}
