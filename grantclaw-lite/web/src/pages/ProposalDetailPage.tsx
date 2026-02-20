import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { AIEvaluationCard } from "../components/AIEvaluationCard";
import { Card } from "../components/Card";
import { api } from "../lib/api";
import { fetchMilestonesByProposal, fetchProposalByHash, MilestoneEvent, ProposalEvent } from "../lib/chain";
import { readDraft } from "../lib/storage";

export function ProposalDetailPage() {
  const { hash = "" } = useParams();
  const [proposal, setProposal] = useState<ProposalEvent | null>(null);
  const [milestones, setMilestones] = useState<MilestoneEvent[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const matchingDraft = useMemo(() => {
    const draft = readDraft();
    if (!draft) {
      return null;
    }

    return draft.proposalHash.toLowerCase() === hash.toLowerCase() ? draft : null;
  }, [hash]);

  async function load() {
    try {
      const [proposalResult, milestoneResult] = await Promise.all([fetchProposalByHash(hash), fetchMilestonesByProposal(hash)]);
      setProposal(proposalResult);
      setMilestones(milestoneResult);
      setError("");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    void load();
  }, [hash]);

  async function submitMilestone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formEl = event.currentTarget;
    const form = new FormData(formEl);

    const payload = {
      proposalHash: hash,
      title: String(form.get("title") || ""),
      description: String(form.get("description") || ""),
      uri: String(form.get("uri") || "")
    };

    try {
      setSubmitting(true);
      await api.milestone(payload);
      formEl.reset();
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="mb-2 text-xl font-semibold tracking-tight">Proposal Detail</h2>
        <p className="mb-2 text-xs">
          <code className="rounded bg-slate-100 px-1 py-0.5">{hash}</code>
        </p>
        {!proposal && <p className="text-sm text-slate-500">Proposal not found in event lookback range.</p>}
        {proposal && (
          <div className="space-y-1 text-sm text-slate-700">
            <p>
              <strong>{proposal.title}</strong>
            </p>
            <p>Grant: {proposal.grantId}</p>
            <p>Submitter: {proposal.submitter}</p>
            {proposal.uri && <p>URI: {proposal.uri}</p>}
          </div>
        )}
      </Card>

      {matchingDraft && <AIEvaluationCard ai={matchingDraft.ai} />}

      <Card>
        <h3 className="mb-3 text-base font-semibold">Submit Milestone</h3>
        <form className="grid gap-3" onSubmit={submitMilestone}>
          <input className="gc-input" name="title" placeholder="Milestone title" required />
          <textarea className="gc-input min-h-24" name="description" placeholder="Milestone description" required />
          <input className="gc-input" name="uri" placeholder="Optional URI" />
          <button className="gc-btn-primary w-fit" disabled={submitting} type="submit">
            {submitting ? "Submitting..." : "Submit Milestone"}
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      </Card>

      <Card>
        <h3 className="mb-3 text-base font-semibold">Milestone Timeline</h3>
        <div className="space-y-2">
          {milestones.map((milestone) => (
            <div className="rounded-xl border border-slate-200 bg-white/70 p-3" key={`${milestone.milestoneHash}-${milestone.blockNumber}`}>
              <p className="font-medium">{milestone.title}</p>
              <p className="truncate text-xs text-slate-500">{milestone.milestoneHash}</p>
              {milestone.uri &&
                (milestone.uri.startsWith("http") ? (
                  <a className="text-xs text-indigo-600 underline" href={milestone.uri} rel="noreferrer" target="_blank">
                    {milestone.uri}
                  </a>
                ) : (
                  <p className="text-xs text-slate-500">{milestone.uri}</p>
                ))}
            </div>
          ))}
          {milestones.length === 0 && <p className="text-sm text-slate-500">No milestones yet.</p>}
        </div>
      </Card>
    </div>
  );
}
