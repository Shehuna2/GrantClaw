import { Contract, JsonRpcProvider, Wallet } from "ethers";
import { env } from "./env.js";

const abi = [
  "function submitProposal(bytes32 proposalHash, string grantId, string title, string uri) external",
  "function submitMilestone(bytes32 proposalHash, bytes32 milestoneHash, string title, string uri) external"
];

const provider = new JsonRpcProvider(env.BSC_TESTNET_RPC);
const signer = new Wallet(env.SUBMITTER_PRIVATE_KEY, provider);

export const registry = new Contract(env.REGISTRY_ADDRESS, abi, signer);
