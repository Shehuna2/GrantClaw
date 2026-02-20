import { allowPostOnly, parseBody, submitMilestone, type VercelRequest, type VercelResponse } from "./_shared";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");
  if (!allowPostOnly(req, res)) {
    return;
  }

  try {
    const payload = parseBody(req);
    const result = await submitMilestone(payload);
    res.status(result.status).json(result.body);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || "Failed to submit milestone" });
  }
}
