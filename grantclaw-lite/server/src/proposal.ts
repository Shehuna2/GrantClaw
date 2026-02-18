import { keccak256, toUtf8Bytes } from "ethers";

export type GenerateProposalInput = {
  grantId: string;
  projectName: string;
  oneLiner: string;
  targetUsers: string;
  whyBNB: string;
};

export type ProposalDoc = {
  grantId: string;
  projectName: string;
  oneLiner: string;
  targetUsers: string;
  whyBNB: string;
};

export function buildProposalDoc(input: GenerateProposalInput): ProposalDoc {
  return {
    grantId: input.grantId,
    projectName: input.projectName,
    oneLiner: input.oneLiner,
    targetUsers: input.targetUsers,
    whyBNB: input.whyBNB
  };
}

export function hashDeterministicJson(doc: object): { json: string; hash: string } {
  const json = JSON.stringify(doc);
  const hash = keccak256(toUtf8Bytes(json));
  return { json, hash };
}

export function buildProposalTitle(input: GenerateProposalInput): string {
  return `${input.projectName} — ${input.oneLiner}`;
}
