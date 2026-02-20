import { Contract, JsonRpcProvider, Wallet, type EventLog } from "ethers";
import { evaluateProposal, evaluateProposalLite, type AIEvaluation } from "../server/src/ai";
import { buildMilestoneHash } from "../server/src/milestone";
import { buildProposalDoc, buildProposalTitle, hashDeterministicJson } from "../server/src/proposal";

const hashRegex = /^0x[a-fA-F0-9]{64}$/;
const pkRegex = /^0x[a-fA-F0-9]{64}$/;
const addressRegex = /^0x[a-fA-F0-9]{40}$/;

type GeneratePayload = {
  grantId: string;
  projectName: string;
  oneLiner: string;
  targetUsers: string;
  whyBNB: string;
};

type SubmitPayload = {
  proposalHash: string;
  grantId: string;
  title: string;
  uri?: string;
};

type MilestonePayload = {
  proposalHash: string;
  title: string;
  description: string;
  uri?: string;
};

export type VercelRequest = {
  method?: string;
  body?: unknown;
};

export type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (payload: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

type VercelHandler = (req: VercelRequest, res: VercelResponse) => Promise<void> | void;

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Server error";
}

export function wrapHandler(fn: VercelHandler): VercelHandler {
  return async function wrapped(req: VercelRequest, res: VercelResponse) {
    res.setHeader("Content-Type", "application/json");

    try {
      await fn(req, res);
    } catch (error) {
      res.status(500).json({ error: errorMessage(error) });
    }
  };
}

export function parseBody<T extends object>(req: VercelRequest): T {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body) as T;
    } catch {
      throw new Error("Invalid JSON body");
    }
  }

  if (req.body && typeof req.body === "object") {
    return req.body as T;
  }

  return {} as T;
}

export function allowPostOnly(req: VercelRequest, res: VercelResponse): boolean {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return false;
  }
  return true;
}

export function allowGetOnly(req: VercelRequest, res: VercelResponse): boolean {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return false;
  }
  return true;
}

function readAIEnv(): { OPENAI_API_KEY?: string } {
  const apiKey = typeof process.env.OPENAI_API_KEY === "string" && process.env.OPENAI_API_KEY.length > 0 ? process.env.OPENAI_API_KEY : undefined;
  return { OPENAI_API_KEY: apiKey };
}

function readChainEnv(): { BSC_TESTNET_RPC: string; SUBMITTER_PRIVATE_KEY: string; REGISTRY_ADDRESS: string } {
  const rpc = process.env.BSC_TESTNET_RPC;
  const pk = process.env.SUBMITTER_PRIVATE_KEY;
  const registry = process.env.REGISTRY_ADDRESS;

  if (!rpc) {
    throw new Error("Missing required environment variable: BSC_TESTNET_RPC");
  }
  if (!pk) {
    throw new Error("Missing required environment variable: SUBMITTER_PRIVATE_KEY");
  }
  if (!pkRegex.test(pk)) {
    throw new Error("Invalid SUBMITTER_PRIVATE_KEY");
  }
  if (!registry) {
    throw new Error("Missing required environment variable: REGISTRY_ADDRESS");
  }
  if (!addressRegex.test(registry)) {
    throw new Error("Invalid REGISTRY_ADDRESS");
  }

  return { BSC_TESTNET_RPC: rpc, SUBMITTER_PRIVATE_KEY: pk, REGISTRY_ADDRESS: registry };
}

function registryContract() {
  const env = readChainEnv();
  const provider = new JsonRpcProvider(env.BSC_TESTNET_RPC, undefined, { batchMaxCount: 1 });
  const signer = new Wallet(env.SUBMITTER_PRIVATE_KEY, provider);
  const abi = [
    "function submitProposal(bytes32 proposalHash, string grantId, string title, string uri) external",
    "function submitMilestone(bytes32 proposalHash, bytes32 milestoneHash, string title, string uri) external",
    "event ProposalSubmitted(bytes32 indexed proposalHash, address indexed submitter, string grantId, string title, string uri, uint256 timestamp)"
  ];
  return new Contract(env.REGISTRY_ADDRESS, abi, signer);
}

function parseGeneratePayload(payload: unknown): GeneratePayload | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  const required = ["grantId", "projectName", "oneLiner", "targetUsers", "whyBNB"];
  if (required.some((key) => typeof p[key] !== "string" || String(p[key]).trim().length === 0)) {
    return null;
  }

  return {
    grantId: String(p.grantId),
    projectName: String(p.projectName),
    oneLiner: String(p.oneLiner),
    targetUsers: String(p.targetUsers),
    whyBNB: String(p.whyBNB)
  };
}

function parseSubmitPayload(payload: unknown): SubmitPayload | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  if (typeof p.proposalHash !== "string" || !hashRegex.test(p.proposalHash)) return null;
  if (typeof p.grantId !== "string" || p.grantId.trim().length === 0) return null;
  if (typeof p.title !== "string" || p.title.trim().length === 0) return null;

  return {
    proposalHash: p.proposalHash,
    grantId: p.grantId,
    title: p.title,
    uri: typeof p.uri === "string" ? p.uri : ""
  };
}

function parseMilestonePayload(payload: unknown): MilestonePayload | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  if (typeof p.proposalHash !== "string" || !hashRegex.test(p.proposalHash)) return null;
  if (typeof p.title !== "string" || p.title.trim().length === 0) return null;
  if (typeof p.description !== "string" || p.description.trim().length === 0) return null;

  return {
    proposalHash: p.proposalHash,
    title: p.title,
    description: p.description,
    uri: typeof p.uri === "string" ? p.uri : ""
  };
}

export async function generateProposalResponse(payload: unknown) {
  const parsed = parseGeneratePayload(payload);
  if (!parsed) {
    return { status: 400 as const, body: { error: "Invalid generate payload" } };
  }

  const proposalDoc = buildProposalDoc(parsed);
  const { json, hash } = hashDeterministicJson(proposalDoc);
  const title = buildProposalTitle(parsed);

  let ai: AIEvaluation | null = null;
  const env = readAIEnv();

  const openAiEvaluation: Promise<AIEvaluation> = env.OPENAI_API_KEY
    ? Promise.race<AIEvaluation>([
        evaluateProposal(proposalDoc),
        new Promise<AIEvaluation>((_, reject) => {
          setTimeout(() => reject(new Error("AI timeout")), 7000);
        })
      ])
    : Promise.reject(new Error("OPENAI_API_KEY is not configured"));

  try {
    ai = await openAiEvaluation;
  } catch {
    ai = evaluateProposalLite(proposalDoc);
  }

  return {
    status: 200 as const,
    body: {
      proposalJson: JSON.parse(json),
      proposalHash: hash,
      title,
      ai
    }
  };
}

export async function submitProposal(payload: unknown) {
  const parsed = parseSubmitPayload(payload);
  if (!parsed) {
    return { status: 400 as const, body: { error: "Invalid submit payload" } };
  }

  const contract = registryContract();
  const tx = await contract.submitProposal(parsed.proposalHash, parsed.grantId, parsed.title, parsed.uri || "");
  await tx.wait();
  return { status: 200 as const, body: { ok: true, txHash: tx.hash } };
}

export async function submitMilestone(payload: unknown) {
  const parsed = parseMilestonePayload(payload);
  if (!parsed) {
    return { status: 400 as const, body: { error: "Invalid milestone payload" } };
  }

  const { milestoneHash } = buildMilestoneHash(parsed);
  const contract = registryContract();
  const tx = await contract.submitMilestone(parsed.proposalHash, milestoneHash, parsed.title, parsed.uri || "");
  await tx.wait();
  return { status: 200 as const, body: { ok: true, txHash: tx.hash, milestoneHash } };
}

export async function fetchGrantProposals() {
  const contract = registryContract();
  const latest = await contract.runner?.provider?.getBlockNumber();
  const toBlock = typeof latest === "number" ? latest : 0;
  const fromBlock = Math.max(0, toBlock - 20000);

  const logs = (await contract.queryFilter(contract.filters.ProposalSubmitted(), fromBlock, toBlock)) as EventLog[];

  const proposals = logs
    .map((event) => ({
      proposalHash: event.args?.proposalHash as string,
      submitter: event.args?.submitter as string,
      grantId: event.args?.grantId as string,
      title: event.args?.title as string,
      uri: event.args?.uri as string,
      timestamp: Number(event.args?.timestamp),
      blockNumber: event.blockNumber,
      txHash: event.transactionHash
    }))
    .sort((a, b) => b.blockNumber - a.blockNumber);

  return { status: 200 as const, body: { proposals } };
}
