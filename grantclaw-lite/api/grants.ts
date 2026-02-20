import { allowGetOnly, fetchGrantProposals, type VercelRequest, type VercelResponse } from "./_shared";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");
  if (!allowGetOnly(req, res)) {
    return;
  }

  try {
    const result = await fetchGrantProposals();
    res.status(result.status).json(result.body);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || "Failed to load grants" });
  }
}
