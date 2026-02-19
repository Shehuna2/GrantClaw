import { JsonRpcProvider } from "ethers";

export type ChainStatus = {
  ok: boolean;
  block?: number;
  error?: string;
};

export function chainConfig(): { rpc?: string; registryAddress?: string } {
  const rpc = import.meta.env.VITE_BSC_TESTNET_RPC as string | undefined;
  const registryAddress = import.meta.env.VITE_REGISTRY_ADDRESS as string | undefined;
  return { rpc, registryAddress };
}

export function shortAddress(address: string): string {
  if (address.length < 10) {
    return address;
  }
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function contractLink(address: string): string {
  return `https://testnet.bscscan.com/address/${address}`;
}

export async function fetchChainStatus(timeoutMs = 2000): Promise<ChainStatus> {
  const { rpc } = chainConfig();

  if (!rpc) {
    return { ok: false, error: "RPC not configured" };
  }

  const provider = new JsonRpcProvider(rpc, undefined, { batchMaxCount: 1 });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("RPC timeout")), timeoutMs);
  });

  try {
    const block = await Promise.race([provider.getBlockNumber(), timeoutPromise]);
    return { ok: true, block };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}
