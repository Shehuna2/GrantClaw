import dotenv from "dotenv";
import { z } from "zod";

if (!process.env.VERCEL) {
  dotenv.config();
}

const envSchema = z.object({
  BSC_TESTNET_RPC: z.string().min(1),
  SUBMITTER_PRIVATE_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  REGISTRY_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  OPENAI_API_KEY: z.string().min(1).optional(),
  PORT: z.string().default("8080")
});

export function readEnv() {
  return envSchema.parse(process.env);
}

export const env = readEnv();
