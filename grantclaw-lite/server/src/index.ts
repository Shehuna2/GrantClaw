import cors from "cors";
import express from "express";
import { z } from "zod";
import { env } from "./env.js";
import { registry } from "./chain.js";
import { buildMilestoneHash } from "./milestone.js";
import { buildProposalDoc, buildProposalTitle, hashDeterministicJson } from "./proposal.js";
import { evaluateProposal } from "./ai.js";

const app = express();
app.use(cors());
app.use(express.json());

const hashRegex = /^0x[a-fA-F0-9]{64}$/;

const generateSchema = z.object({
  grantId: z.string().min(1),
  projectName: z.string().min(1),
  oneLiner: z.string().min(1),
  targetUsers: z.string().min(1),
  whyBNB: z.string().min(1)
});

app.post("/api/generate", async (req, res) => {
  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const proposalDoc = buildProposalDoc(parsed.data);
  const { json, hash } = hashDeterministicJson(proposalDoc);
  const title = buildProposalTitle(parsed.data);
  let ai = null;

  if (env.OPENAI_API_KEY) {
    try {
      ai = await evaluateProposal(proposalDoc);
    } catch (error) {
      console.warn("AI evaluation unavailable:", (error as Error).message);
    }
  }

  return res.json({
    proposalJson: JSON.parse(json),
    proposalHash: hash,
    title,
    ai
  });
});

const submitSchema = z.object({
  proposalHash: z.string().regex(hashRegex),
  grantId: z.string().min(1),
  title: z.string().min(1),
  uri: z.string().default("")
});

app.post("/api/submit", async (req, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const tx = await registry.submitProposal(parsed.data.proposalHash, parsed.data.grantId, parsed.data.title, parsed.data.uri || "");
    await tx.wait();
    return res.json({ ok: true, txHash: tx.hash });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

const milestoneSchema = z.object({
  proposalHash: z.string().regex(hashRegex),
  title: z.string().min(1),
  description: z.string().min(1),
  uri: z.string().default("")
});

app.post("/api/milestone", async (req, res) => {
  const parsed = milestoneSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const { milestoneHash } = buildMilestoneHash(parsed.data);
    const tx = await registry.submitMilestone(parsed.data.proposalHash, milestoneHash, parsed.data.title, parsed.data.uri || "");
    await tx.wait();
    return res.json({ ok: true, txHash: tx.hash, milestoneHash });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/health", (_, res) => {
  res.json({ ok: true });
});

app.listen(Number(env.PORT), () => {
  console.log(`GrantClaw server listening on port ${env.PORT}`);
});
