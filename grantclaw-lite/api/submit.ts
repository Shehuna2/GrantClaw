import { allowPostOnly, parseBody, submitProposal, type VercelRequest, type VercelResponse, wrapHandler } from "./_shared";

export default wrapHandler(async function (req: VercelRequest, res: VercelResponse) {
  if (!allowPostOnly(req, res)) {
    return;
  }

  const payload = parseBody(req);
  const result = await submitProposal(payload);
  return res.status(result.status).json(result.body);
});
