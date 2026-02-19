// Path: web/src/lib/chain.ts
import { Contract, JsonRpcProvider, type EventLog } from "ethers";

const abi = [
  "event ProposalSubmitted(bytes32 indexed proposalHash, address indexed submitter, string grantId, string title, string uri, uint256 timestamp)",
  "event MilestoneSubmitted(bytes32 indexed proposalHash, bytes32 indexed milestoneHash, address indexed submitter, string title, string uri, uint256 timestamp)"
];

const START_BLOCK_CACHE_KEY = "grantclaw:startBlock:v1";

export class RateLimitError extends Error {
  readonly retryAfterMs: number;
  constructor(message = "RPC rate limited", retryAfterMs = 1200) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

export type ProposalEvent = {
  proposalHash: string;
  submitter: string;
  grantId: string;
  title: string;
  uri: string;
  timestamp: number;
  blockNumber: number;
  txHash: string;
};

export type MilestoneEvent = {
  proposalHash: string;
  milestoneHash: string;
  submitter: string;
  title: string;
  uri: string;
  timestamp: number;
  blockNumber: number;
  txHash: string;
};

function env() {
  const rpc = import.meta.env.VITE_BSC_TESTNET_RPC as string | undefined;
  const registryAddress = import.meta.env.VITE_REGISTRY_ADDRESS as string | undefined;
  const lookbackBlocks = Number(import.meta.env.VITE_EVENT_LOOKBACK_BLOCKS || "20000");
  const startBlockEnv = Number(import.meta.env.VITE_REGISTRY_START_BLOCK || "0");

  if (!rpc) throw new Error("Missing VITE_BSC_TESTNET_RPC in web/.env.local");
  if (!registryAddress) throw new Error("Missing VITE_REGISTRY_ADDRESS in web/.env.local");
  return { rpc, registryAddress, lookbackBlocks, startBlockEnv };
}

function client() {
  const { rpc, registryAddress } = env();

  // disable batching: avoids "eth_getLogs in batch triggered rate limit"
  const provider = new JsonRpcProvider(rpc, undefined, { batchMaxCount: 1 });
  const contract = new Contract(registryAddress, abi, provider);
  return { provider, contract };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRateLimitError(e: unknown): boolean {
  const any = e as any;
  const code = String(any?.code ?? "");
  const nested = String(any?.error?.code ?? "");
  const msg = String(any?.message ?? any?.error?.message ?? "");
  return (
    code === "BAD_DATA" ||
    nested === "-32005" ||
    msg.toLowerCase().includes("rate limit") ||
    msg.toLowerCase().includes("eth_getlogs")
  );
}

function loadCachedStartBlock(): number {
  try {
    const raw = localStorage.getItem(START_BLOCK_CACHE_KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function saveCachedStartBlock(n: number) {
  try {
    localStorage.setItem(START_BLOCK_CACHE_KEY, String(n));
  } catch {
    // ignore
  }
}

async function eventRange(): Promise<[number, number]> {
  const { lookbackBlocks, startBlockEnv } = env();
  const { provider } = client();

  const latest = await provider.getBlockNumber();
  const cached = loadCachedStartBlock();

  const start = Math.max(0, startBlockEnv || cached || latest - lookbackBlocks);

  if (!startBlockEnv && cached === 0) saveCachedStartBlock(start);
  return [start, latest];
}

async function queryFilterChunked(
  filter: any,
  fromBlock: number,
  toBlock: number,
  opts?: { chunkSize?: number; pauseMs?: number }
): Promise<EventLog[]> {
  const { contract } = client();
  const { startBlockEnv } = env();

  const chunkSize = opts?.chunkSize ?? 5_000;
  const pauseMs = opts?.pauseMs ?? 150;

  const out: EventLog[] = [];

  for (let start = fromBlock; start <= toBlock; start += chunkSize) {
    const end = Math.min(toBlock, start + chunkSize - 1);

    try {
      out.push(...((await contract.queryFilter(filter, start, end)) as EventLog[]));
    } catch (e) {
      if (!isRateLimitError(e)) throw e;

      await sleep(900);
      try {
        out.push(...((await contract.queryFilter(filter, start, end)) as EventLog[]));
      } catch (e2) {
        if (isRateLimitError(e2)) throw new RateLimitError("RPC rate limited while reading events", 1500);
        throw e2;
      }
    }

    await sleep(pauseMs);
  }

  if (!startBlockEnv && out.length > 0) {
    const maxBlock = out.reduce((m, l) => Math.max(m, l.blockNumber), 0);
    if (maxBlock > 0) saveCachedStartBlock(Math.max(0, maxBlock - 500));
  }

  return out;
}

export async function fetchProposalEvents(): Promise<ProposalEvent[]> {
  const [fromBlock, toBlock] = await eventRange();
  const { contract } = client();

  const logs = await queryFilterChunked(contract.filters.ProposalSubmitted(), fromBlock, toBlock);

  return logs
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
}

export async function fetchProposalByHash(hash: string): Promise<ProposalEvent | null> {
  const [fromBlock, toBlock] = await eventRange();
  const { contract } = client();

  const logs = await queryFilterChunked(contract.filters.ProposalSubmitted(hash), fromBlock, toBlock);
  const event = logs.at(-1);
  if (!event) return null;

  return {
    proposalHash: event.args?.proposalHash as string,
    submitter: event.args?.submitter as string,
    grantId: event.args?.grantId as string,
    title: event.args?.title as string,
    uri: event.args?.uri as string,
    timestamp: Number(event.args?.timestamp),
    blockNumber: event.blockNumber,
    txHash: event.transactionHash
  };
}

export async function fetchMilestonesByProposal(hash: string): Promise<MilestoneEvent[]> {
  const [fromBlock, toBlock] = await eventRange();
  const { contract } = client();

  const logs = await queryFilterChunked(contract.filters.MilestoneSubmitted(hash), fromBlock, toBlock);

  return logs
    .map((event) => ({
      proposalHash: event.args?.proposalHash as string,
      milestoneHash: event.args?.milestoneHash as string,
      submitter: event.args?.submitter as string,
      title: event.args?.title as string,
      uri: event.args?.uri as string,
      timestamp: Number(event.args?.timestamp),
      blockNumber: event.blockNumber,
      txHash: event.transactionHash
    }))
    .sort((a, b) => a.blockNumber - b.blockNumber);
}

export function txLink(txHash: string): string {
  return `https://testnet.bscscan.com/tx/${txHash}`;
}
