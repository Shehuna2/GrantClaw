const configuredApiBase = (import.meta.env.VITE_API_BASE as string | undefined)?.trim();
const apiBase = configuredApiBase ? configuredApiBase.replace(/\/$/, "") : "";

async function postJson<T>(path: string, body: object): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "API request failed");
  }
  return payload as T;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBase}${path}`);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "API request failed");
  }
  return payload as T;
}

export type GeneratePayload = {
  grantId: string;
  projectName: string;
  oneLiner: string;
  targetUsers: string;
  whyBNB: string;
};

export type AIEvaluation = {
  summary: string;
  score: number;
  risk: "Low" | "Medium" | "High";
  suggestedMilestones: { title: string; description: string; kpi: string }[];
};

export type GenerateResponse = {
  proposalJson: Record<string, string>;
  proposalHash: string;
  title: string;
  ai?: AIEvaluation | null;
};

export type SubmitPayload = {
  proposalHash: string;
  grantId: string;
  title: string;
  uri?: string;
};

export type SubmitResponse = {
  ok: true;
  txHash: string;
};

export type MilestonePayload = {
  proposalHash: string;
  title: string;
  description: string;
  uri?: string;
};

export type MilestoneResponse = {
  ok: true;
  txHash: string;
  milestoneHash: string;
};

export type GrantsResponse = {
  proposals: Array<{
    proposalHash: string;
    submitter: string;
    grantId: string;
    title: string;
    uri: string;
    timestamp: number;
    blockNumber: number;
    txHash: string;
  }>;
};

export const api = {
  generate: (payload: GeneratePayload) => postJson<GenerateResponse>("/api/generate", payload),
  submit: (payload: SubmitPayload) => postJson<SubmitResponse>("/api/submit", payload),
  milestone: (payload: MilestonePayload) => postJson<MilestoneResponse>("/api/milestone", payload),
  grants: () => getJson<GrantsResponse>("/api/grants")
};
