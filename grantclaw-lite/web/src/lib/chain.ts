import { Contract, JsonRpcProvider } from "ethers";

const rpc = import.meta.env.VITE_BSC_TESTNET_RPC as string;
const registryAddress = import.meta.env.VITE_REGISTRY_ADDRESS as string;
const lookbackBlocks = Number(import.meta.env.VITE_EVENT_LOOKBACK_BLOCKS || "200000");

const abi = [
  "event ProposalSubmitted(bytes32 indexed proposalHash, address indexed submitter, string grantId, string title, string uri, uint256 timestamp)",
  "event MilestoneSubmitted(bytes32 indexed proposalHash, bytes32 indexed milestoneHash, address indexed submitter, string title, string uri, uint256 timestamp)"
];

const provider = new JsonRpcProvider(rpc);
const contract = new Contract(registryAddress, abi, provider);

export type ProposalEvent = {
  proposalHash: string;
  submitter: string;
  grantId: string;
  title: string;
  uri: string;
  timestamp: number;
  blockNumber: number;
};

export type MilestoneEvent = {
  proposalHash: string;
  milestoneHash: string;
  submitter: string;
  title: string;
  uri: string;
  timestamp: number;
  blockNumber: number;
};

async function eventRange(): Promise<[number, number]> {
  const latest = await provider.getBlockNumber();
  return [Math.max(0, latest - lookbackBlocks), latest];
}

export async function fetchProposalEvents(): Promise<ProposalEvent[]> {
  const [fromBlock, toBlock] = await eventRange();
  const events = await contract.queryFilter(contract.filters.ProposalSubmitted(), fromBlock, toBlock);

  return events
    .map((event) => ({
      proposalHash: event.args?.proposalHash as string,
      submitter: event.args?.submitter as string,
      grantId: event.args?.grantId as string,
      title: event.args?.title as string,
      uri: event.args?.uri as string,
      timestamp: Number(event.args?.timestamp),
      blockNumber: event.blockNumber
    }))
    .sort((a, b) => b.blockNumber - a.blockNumber);
}

export async function fetchProposalByHash(hash: string): Promise<ProposalEvent | null> {
  const [fromBlock, toBlock] = await eventRange();
  const events = await contract.queryFilter(contract.filters.ProposalSubmitted(hash), fromBlock, toBlock);
  const event = events.at(-1);
  if (!event) return null;

  return {
    proposalHash: event.args?.proposalHash as string,
    submitter: event.args?.submitter as string,
    grantId: event.args?.grantId as string,
    title: event.args?.title as string,
    uri: event.args?.uri as string,
    timestamp: Number(event.args?.timestamp),
    blockNumber: event.blockNumber
  };
}

export async function fetchMilestonesByProposal(hash: string): Promise<MilestoneEvent[]> {
  const [fromBlock, toBlock] = await eventRange();
  const events = await contract.queryFilter(contract.filters.MilestoneSubmitted(hash), fromBlock, toBlock);

  return events
    .map((event) => ({
      proposalHash: event.args?.proposalHash as string,
      milestoneHash: event.args?.milestoneHash as string,
      submitter: event.args?.submitter as string,
      title: event.args?.title as string,
      uri: event.args?.uri as string,
      timestamp: Number(event.args?.timestamp),
      blockNumber: event.blockNumber
    }))
    .sort((a, b) => a.blockNumber - b.blockNumber);
}

export function txLink(txHash: string): string {
  return `https://testnet.bscscan.com/tx/${txHash}`;
}
