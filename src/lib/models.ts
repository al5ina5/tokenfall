// ── Provider Adapter Interface ──
// Each provider normalizes to a standardized TokenFall internal format.

export interface ModelDefinition {
  id: string; // "deepseek-v4-flash"
  name: string; // "DeepSeek V4 Flash"
  provider: string; // "deepseek"
  tier: "cheap" | "good" | "best";
  inputPricePer1M: number;
  outputPricePer1M: number;
  contextWindow: number;
  maxOutput: number;
  speed: "fast" | "medium" | "slow";
  strengths: string[];
  requiresAuth: "none" | "common" | "rare" | "legendary"; // NFT tier gate
  enabled: boolean;
}

// ── All available models ──
export const MODELS: ModelDefinition[] = [
  {
    id: "deepseek-v4-flash",
    name: "DeepSeek V4 Flash",
    provider: "deepseek",
    tier: "cheap",
    inputPricePer1M: 0.14,
    outputPricePer1M: 0.28,
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    speed: "medium",
    strengths: ["coding", "chat", "reasoning"],
    requiresAuth: "none",
    enabled: !!process.env.DEEPSEEK_API_KEY,
  },
  {
    id: "llama-3.3-70b",
    name: "Llama 3.3 70B",
    provider: "deepinfra",
    tier: "cheap",
    inputPricePer1M: 0.10,
    outputPricePer1M: 0.32,
    contextWindow: 128_000,
    maxOutput: 16_384,
    speed: "fast",
    strengths: ["chat", "coding"],
    requiresAuth: "none",
    enabled: !!process.env.DEEPINFRA_API_KEY,
  },
  {
    id: "groq-llama-3.1-8b",
    name: "Groq Llama 3.1 8B",
    provider: "groq",
    tier: "cheap",
    inputPricePer1M: 0.05,
    outputPricePer1M: 0.10,
    contextWindow: 128_000,
    maxOutput: 8_192,
    speed: "fast",
    strengths: ["chat", "fast"],
    requiresAuth: "none",
    enabled: !!process.env.GROQ_API_KEY,
  },
  {
    id: "glm-4.7-flash",
    name: "GLM-4.7 Flash",
    provider: "zai",
    tier: "cheap",
    inputPricePer1M: 0,
    outputPricePer1M: 0,
    contextWindow: 128_000,
    maxOutput: 4_096,
    speed: "medium",
    strengths: ["chat", "free"],
    requiresAuth: "none",
    enabled: !!process.env.ZAI_API_KEY,
  },
  {
    id: "gemini-3-flash",
    name: "Gemini 3 Flash",
    provider: "google",
    tier: "good",
    inputPricePer1M: 0.50,
    outputPricePer1M: 3.00,
    contextWindow: 1_000_000,
    maxOutput: 8_192,
    speed: "medium",
    strengths: ["chat", "coding", "multimodal"],
    requiresAuth: "none",
    enabled: !!process.env.GEMINI_API_KEY,
  },
  {
    id: "minimax-m3",
    name: "MiniMax M3",
    provider: "minimax",
    tier: "good",
    inputPricePer1M: 0.60,
    outputPricePer1M: 2.40,
    contextWindow: 1_000_000,
    maxOutput: 512_000,
    speed: "medium",
    strengths: ["chat", "coding", "reasoning"],
    requiresAuth: "none",
    enabled: !!process.env.MINIMAX_API_KEY,
  },
  {
    id: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash-Lite",
    provider: "google",
    tier: "cheap",
    inputPricePer1M: 0.25,
    outputPricePer1M: 1.50,
    contextWindow: 1_000_000,
    maxOutput: 8_192,
    speed: "fast",
    strengths: ["chat", "cheap"],
    requiresAuth: "none",
    enabled: !!process.env.GEMINI_API_KEY,
  },
];

// ── Tier price caps (what we charge users, credits per 1M) ──
export const TIER_PRICING = {
  cheap: { input: 0.35, output: 0.45 }, // 1 token = 1 credit = ~$0.0001
  good: { input: 1.50, output: 3.50 },
  best: { input: 10.00, output: 30.00 },
};

export function getEnabledModels(): ModelDefinition[] {
  return MODELS.filter((m) => m.enabled);
}

export function getModelById(id: string): ModelDefinition | undefined {
  return MODELS.find((m) => m.id === id && m.enabled);
}

export function getModelsByTier(tier: string): ModelDefinition[] {
  return MODELS.filter((m) => m.tier === tier && m.enabled);
}
