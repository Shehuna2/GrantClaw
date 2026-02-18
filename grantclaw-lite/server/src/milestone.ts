import { hashDeterministicJson } from "./proposal.js";

export type MilestoneInput = {
  proposalHash: string;
  title: string;
  description: string;
  uri?: string;
};

export type MilestoneDoc = {
  proposalHash: string;
  title: string;
  description: string;
};

export function buildMilestoneDoc(input: MilestoneInput): MilestoneDoc {
  return {
    proposalHash: input.proposalHash,
    title: input.title,
    description: input.description
  };
}

export function buildMilestoneHash(input: MilestoneInput): { milestoneJson: string; milestoneHash: string } {
  const doc = buildMilestoneDoc(input);
  const { json, hash } = hashDeterministicJson(doc);
  return { milestoneJson: json, milestoneHash: hash };
}
