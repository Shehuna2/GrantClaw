import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { saveDraft } from "../lib/storage";
import { Card } from "../components/Card";

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
    <Card>
      <h2 className="mb-4 text-lg font-semibold">Generate Proposal</h2>
      <form className="grid gap-3" onSubmit={onSubmit}>
        <input className="rounded border p-2" name="grantId" placeholder="Grant ID" required />
        <input className="rounded border p-2" name="projectName" placeholder="Project Name" required />
        <input className="rounded border p-2" name="oneLiner" placeholder="One-liner" required />
        <textarea className="rounded border p-2" name="targetUsers" placeholder="Target users" required />
        <textarea className="rounded border p-2" name="whyBNB" placeholder="Why BNB Chain" required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="rounded bg-slate-900 px-4 py-2 text-white" disabled={loading} type="submit">
          {loading ? "Generating..." : "Generate"}
        </button>
      </form>
    </Card>
  );
}
