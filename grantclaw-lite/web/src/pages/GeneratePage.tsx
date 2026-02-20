import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { api } from "../lib/api";
import { saveDraft } from "../lib/storage";

export function GeneratePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const payload = {
      grantId: String(form.get("grantId") || ""),
      projectName: String(form.get("projectName") || ""),
      oneLiner: String(form.get("oneLiner") || ""),
      targetUsers: String(form.get("targetUsers") || ""),
      whyBNB: String(form.get("whyBNB") || "")
    };

    try {
      const generated = await api.generate(payload);
      saveDraft({ ...payload, ...generated });
      navigate("/preview");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-3xl">
      <h2 className="mb-1 text-xl font-semibold tracking-tight">Generate Proposal</h2>
      <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">Capture key project details and generate deterministic proposal JSON + hash.</p>
      <form className="grid gap-3" onSubmit={onSubmit}>
        <input className="gc-input" name="grantId" placeholder="Grant ID" required />
        <input className="gc-input" name="projectName" placeholder="Project Name" required />
        <input className="gc-input" name="oneLiner" placeholder="One-liner" required />
        <textarea className="gc-input min-h-24" name="targetUsers" placeholder="Target users" required />
        <textarea className="gc-input min-h-24" name="whyBNB" placeholder="Why BNB Chain" required />
        {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
        <button className="gc-btn-primary w-fit" disabled={loading} type="submit">
          {loading ? "Generating..." : "Generate"}
        </button>
      </form>
    </Card>
  );
}
