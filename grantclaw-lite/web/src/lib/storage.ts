import { GeneratePayload, GenerateResponse } from "./api";

const DRAFT_KEY = "grantclaw:draft";

export type ProposalDraft = GeneratePayload & GenerateResponse;

export function saveDraft(draft: ProposalDraft): void {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function readDraft(): ProposalDraft | null {
  const raw = localStorage.getItem(DRAFT_KEY);
  return raw ? (JSON.parse(raw) as ProposalDraft) : null;
}
