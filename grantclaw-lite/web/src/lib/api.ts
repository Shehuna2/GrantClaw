const apiBase = import.meta.env.VITE_API_BASE as string;

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

export type GeneratePayload = {
  grantId: string;
  projectName: string;
  oneLiner: string;
  targetUsers: string;
  whyBNB: string;
};

export type GenerateResponse = {
  proposalJson: Record<string, string>;
  proposalHash: string;
  title: string;
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

export const api = {
  generate: (payload: GeneratePayload) => postJson<GenerateResponse>("/api/generate", payload),
  submit: (payload: SubmitPayload) => postJson<SubmitResponse>("/api/submit", payload),
  milestone: (payload: MilestonePayload) => postJson<MilestoneResponse>("/api/milestone", payload)
};
