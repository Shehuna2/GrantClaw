import { env } from "./env.js";

export type AIEvaluation = {
  summary: string;
  score: number;
  risk: "Low" | "Medium" | "High";
  suggestedMilestones: { title: string; description: string; kpi: string }[];
};

function extractFirstJsonObject(raw: string): string | null {
  const start = raw.indexOf("{");
  if (start < 0) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < raw.length; index += 1) {
    const char = raw[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return raw.slice(start, index + 1);
      }
    }
  }

  return null;
}

function parseRawResponse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    const jsonBlock = extractFirstJsonObject(raw);
    if (!jsonBlock) {
      throw new Error("Could not parse AI output as JSON");
    }

    try {
      return JSON.parse(jsonBlock);
    } catch {
      throw new Error("Could not parse extracted AI JSON block");
    }
  }
}

function normalizeEvaluation(value: unknown): AIEvaluation {
  if (!value || typeof value !== "object") {
    throw new Error("AI output was not an object");
  }

  const data = value as Record<string, unknown>;
  const summary = typeof data.summary === "string" ? data.summary : "";
  const scoreInput = typeof data.score === "number" ? data.score : Number(data.score);
  const parsedScore = Number.isFinite(scoreInput) ? scoreInput : 0;
  const score = Math.max(0, Math.min(100, Math.round(parsedScore)));
  const riskValue = data.risk;
  const risk: AIEvaluation["risk"] = riskValue === "Low" || riskValue === "Medium" || riskValue === "High" ? riskValue : "Medium";

  const rawMilestones = Array.isArray(data.suggestedMilestones) ? data.suggestedMilestones : [];
  const suggestedMilestones = rawMilestones
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const milestone = entry as Record<string, unknown>;
      return {
        title: typeof milestone.title === "string" ? milestone.title : "",
        description: typeof milestone.description === "string" ? milestone.description : "",
        kpi: typeof milestone.kpi === "string" ? milestone.kpi : ""
      };
    })
    .filter((entry): entry is { title: string; description: string; kpi: string } => entry !== null)
    .slice(0, 3);

  return {
    summary,
    score,
    risk,
    suggestedMilestones
  };
}

export async function evaluateProposal(doc: unknown): Promise<AIEvaluation> {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const dynamicImport = new Function("specifier", "return import(specifier)") as (specifier: string) => Promise<{ default: new (config: { apiKey: string }) => { responses: { create: (payload: unknown) => Promise<{ output_text?: string | null }> } } }>;
  const openAiModule = await dynamicImport("openai");
  const OpenAIClient = openAiModule.default;
  const client = new OpenAIClient({ apiKey: env.OPENAI_API_KEY });

  const response = await client.responses.create({
    model: "gpt-4o-mini",
    input: [
      {
        role: "system",
        content:
          "You are an AI judge assistant for OpenClaw grant proposals. Return STRICT JSON ONLY with this exact schema: {\"summary\": string, \"score\": number, \"risk\": \"Low\"|\"Medium\"|\"High\", \"suggestedMilestones\": [{\"title\": string, \"description\": string, \"kpi\": string}, {\"title\": string, \"description\": string, \"kpi\": string}, {\"title\": string, \"description\": string, \"kpi\": string}]}. suggestedMilestones MUST contain exactly 3 items and each KPI must be measurable. Do not include markdown, comments, or extra keys."
      },
      {
        role: "user",
        content: `Evaluate this proposal for feasibility and execution risk:\n${JSON.stringify(doc)}`
      }
    ]
  });

  const raw = response.output_text ?? "";
  const parsed = parseRawResponse(raw);
  return normalizeEvaluation(parsed);
}
