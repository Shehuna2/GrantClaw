import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { api } from "../lib/api";
import { readDraft } from "../lib/storage";
import { txLink } from "../lib/chain";

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
    <Card>
      <h2 className="mb-4 text-lg font-semibold">Submit Proposal Onchain</h2>
      <p className="mb-2 text-sm">{currentDraft.title}</p>
      <input className="mb-3 w-full rounded border p-2" onChange={(e) => setUri(e.target.value)} placeholder="Optional URI (ipfs://...)" value={uri} />
      <button className="rounded bg-slate-900 px-4 py-2 text-white" disabled={loading} onClick={submitProposal} type="button">
        {loading ? "Submitting..." : "Submit Onchain"}
      </button>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {txHash && (
        <div className="mt-4 space-y-2 text-sm">
          <p>Tx: <code>{txHash}</code></p>
          <a className="text-blue-600 underline" href={txLink(txHash)} rel="noreferrer" target="_blank">View on BscScan</a>
          <div>
            <button className="rounded bg-slate-200 px-3 py-2" onClick={() => navigate(`/p/${currentDraft.proposalHash}`)} type="button">
              Go to Proposal Detail
            </button>
          </div>
        </div>
      )}
      <p className="mt-4 text-xs text-slate-500"><Link to="/feed">Or open feed</Link></p>
    </Card>
  );
}
