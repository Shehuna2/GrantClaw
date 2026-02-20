import { useNavigate } from "react-router-dom";
import { AIEvaluationCard } from "../components/AIEvaluationCard";
import { Card } from "../components/Card";
import { readDraft } from "../lib/storage";

export function PreviewPage() {
  const navigate = useNavigate();
  const draft = readDraft();

  if (!draft) {
    return <Card>No draft available. Start on Generate page.</Card>;
  }

  const currentDraft = draft;
  const jsonString = JSON.stringify(currentDraft.proposalJson);

  function downloadJson() {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentDraft.grantId}-proposal.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="mb-4 text-xl font-semibold tracking-tight">Preview Proposal</h2>
        <p className="mb-2 text-sm text-slate-600">
          Hash: <code className="rounded bg-slate-100 px-1 py-0.5">{currentDraft.proposalHash}</code>
        </p>
        <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">{JSON.stringify(currentDraft.proposalJson, null, 2)}</pre>
        <div className="mt-4 flex gap-2">
          <button className="gc-btn-secondary" onClick={downloadJson} type="button">
            Download JSON
          </button>
          <button className="gc-btn-primary" onClick={() => navigate("/submit")} type="button">
            Continue to Submit
          </button>
        </div>
      </Card>
      <AIEvaluationCard ai={currentDraft.ai} />
    </div>
  );
}
