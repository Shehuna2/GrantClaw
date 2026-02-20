import { allowGetOnly, fetchGrantProposals, type VercelRequest, type VercelResponse, wrapHandler } from "./_shared";

export default wrapHandler(async function (req: VercelRequest, res: VercelResponse) {
  if (!allowGetOnly(req, res)) {
    return;
  }

  const result = await fetchGrantProposals();
  return res.status(result.status).json(result.body);
});
