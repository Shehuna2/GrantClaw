import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { txLink } from "../lib/chain";
import { api } from "../lib/api";
import { readDraft } from "../lib/storage";

export function SubmitPage() {
  const navigate = useNavigate();
  const draft = readDraft();
  const [uri, setUri] = useState("");
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!draft) return <Card>No draft found. Generate first.</Card>;
  const currentDraft = draft;

  async function submitProposal() {
    setLoading(true);
    setError("");
    try {
      const response = await api.submit({
        proposalHash: currentDraft.proposalHash,
        grantId: currentDraft.grantId,
        title: currentDraft.title,
        uri
      });
      setTxHash(response.txHash);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-3xl">
      <h2 className="mb-4 text-xl font-semibold tracking-tight">Submit Proposal Onchain</h2>
      <p className="mb-2 text-sm text-slate-600">{currentDraft.title}</p>
      <input className="gc-input mb-3" onChange={(e) => setUri(e.target.value)} placeholder="Optional URI (ipfs://...)" value={uri} />
      <button className="gc-btn-primary" disabled={loading} onClick={submitProposal} type="button">
        {loading ? "Submitting..." : "Submit Onchain"}
      </button>
      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      {txHash && (
        <div className="mt-4 space-y-2 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-sm">
          <p>
            Tx: <code>{txHash}</code>
          </p>
          <a className="font-medium text-indigo-600 underline" href={txLink(txHash)} rel="noreferrer" target="_blank">
            View on BscScan
          </a>
          <div>
            <button className="gc-btn-secondary" onClick={() => navigate(`/p/${currentDraft.proposalHash}`)} type="button">
              Go to Proposal Detail
            </button>
          </div>
        </div>
      )}
      <p className="mt-4 text-xs text-slate-500">
        <Link className="underline" to="/feed">
          Or open feed
        </Link>
      </p>
    </Card>
  );
}
