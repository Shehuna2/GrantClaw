import { AIEvaluation } from "../lib/api";
import { Card } from "./Card";

type Props = {
  ai?: AIEvaluation | null;
};

export function AIEvaluationCard({ ai }: Props) {
  if (!ai) {
    return (
      <Card>
        <h3 className="mb-3 text-base font-semibold">AI Evaluation</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">AI evaluation unavailable (missing API key or failed).</p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="mb-3 text-base font-semibold">AI Evaluation</h3>
      <p className="mb-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{ai.summary}</p>
      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 font-semibold text-indigo-700">Score: {ai.score}/100</span>
        <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 font-semibold text-amber-700">Risk: {ai.risk}</span>
      </div>
      <div className="space-y-3">
        {ai.suggestedMilestones.map((milestone, index) => (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 p-3" key={`${milestone.title}-${index + 1}`}>
            <p className="font-medium">
              {index + 1}. {milestone.title}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">{milestone.description}</p>
            <p className="text-sm">
              <span className="font-medium">KPI:</span> {milestone.kpi}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
