import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  BSC_TESTNET_RPC: z.string().min(1),
  SUBMITTER_PRIVATE_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  REGISTRY_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  OPENAI_API_KEY: z.string().min(1).optional(),
  PORT: z.string().default("8080")
});

export const env = envSchema.parse(process.env);
