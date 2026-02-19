// Path: web/src/lib/chain.ts
import { Contract, JsonRpcProvider, type EventLog } from "ethers";

const rpc = import.meta.env.VITE_BSC_TESTNET_RPC as string;
const registryAddress = import.meta.env.VITE_REGISTRY_ADDRESS as string;
const lookbackBlocks = Number(import.meta.env.VITE_EVENT_LOOKBACK_BLOCKS || "20000");

const abi = [
  "event ProposalSubmitted(bytes32 indexed proposalHash, address indexed submitter, string grantId, string title, string uri, uint256 timestamp)",
  "event MilestoneSubmitted(bytes32 indexed proposalHash, bytes32 indexed milestoneHash, address indexed submitter, string title, string uri, uint256 timestamp)"
];

function assertEnv() {
  if (!rpc) throw new Error("Missing VITE_BSC_TESTNET_RPC");
  if (!registryAddress) throw new Error("Missing VITE_REGISTRY_ADDRESS");
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Disable JSON-RPC batching to reduce "eth_getLogs in batch triggered rate limit".
 * Chunk eth_getLogs into smaller ranges to avoid provider throttling.
 */
const provider = new JsonRpcProvider(rpc, undefined, { batchMaxCount: 1 });
const contract = new Contract(registryAddress, abi, provider);

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

async function eventRange(): Promise<[number, number]> {
  assertEnv();
  const latest = await provider.getBlockNumber();
  return [Math.max(0, latest - lookbackBlocks), latest];
}

function isRateLimitError(e: unknown): boolean {
  const any = e as any;
  const code = String(any?.code ?? "");
  const nested = String(any?.error?.code ?? "");
  const msg = String(any?.message ?? any?.error?.message ?? "");
  return (
    code === "BAD_DATA" ||
    nested === "-32005" ||
    msg.includes("rate limit") ||
    msg.includes("eth_getLogs")
  );
}

async function queryFilterChunked(
  filter: any,
  fromBlock: number,
  toBlock: number,
  opts?: { chunkSize?: number; pauseMs?: number }
): Promise<EventLog[]> {
  const chunkSize = opts?.chunkSize ?? 5_000;
  const pauseMs = opts?.pauseMs ?? 150;

  const out: EventLog[] = [];

  for (let start = fromBlock; start <= toBlock; start += chunkSize) {
    const end = Math.min(toBlock, start + chunkSize - 1);

    try {
      const part = (await contract.queryFilter(filter, start, end)) as EventLog[];
      out.push(...part);
    } catch (e) {
      if (!isRateLimitError(e)) throw e;

      // backoff + retry once
      await sleep(900);
      const part = (await contract.queryFilter(filter, start, end)) as EventLog[];
      out.push(...part);
    }

    await sleep(pauseMs);
  }

  return out;
}

export async function fetchProposalEvents(): Promise<ProposalEvent[]> {
  const [fromBlock, toBlock] = await eventRange();
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