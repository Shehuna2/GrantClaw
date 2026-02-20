import { AIEvaluation } from "../lib/api";
import { Card } from "./Card";

type Props = {
  ai?: AIEvaluation | null;
};

export function AIEvaluationCard({ ai }: Props) {
  if (!ai) {
    return (
      <Card>
        <h3 className="mb-3 font-semibold">AI Evaluation</h3>
        <p className="text-sm text-slate-500">AI evaluation unavailable (missing API key or failed).</p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="mb-3 font-semibold">AI Evaluation</h3>
      <p className="mb-3 whitespace-pre-wrap text-sm text-slate-700">{ai.summary}</p>
      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-700">Score: {ai.score}/100</span>
        <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700">Risk: {ai.risk}</span>
      </div>
      <div className="space-y-3">
        {ai.suggestedMilestones.map((milestone, index) => (
          <div className="rounded border p-3" key={`${milestone.title}-${index + 1}`}>
            <p className="font-medium">{index + 1}. {milestone.title}</p>
            <p className="text-sm text-slate-600">{milestone.description}</p>
            <p className="text-sm"><span className="font-medium">KPI:</span> {milestone.kpi}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
