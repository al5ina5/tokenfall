// ── Smart Router ──
// Cost-aware routing with fallback chains.
import { getModelById, MODELS, type ModelDefinition } from "./models";
import { getProvider } from "./providers";
import type { ChatMessage, UnifiedRequest } from "./providers";

interface RouteResult {
  success: boolean;
  content: string;
  model: string;
  provider: string;
  tokensInput: number;
  tokensOutput: number;
  costUsdCents: number; // what we paid the upstream provider
  latencyMs: number;
  error?: string;
}

export async function routeRequest(
  modelId: string | "auto",
  messages: ChatMessage[],
  maxTokens?: number,
  temperature?: number,
  nftTier = "none"
): Promise<RouteResult> {
  const start = Date.now();

  // Determine which model to use
  let model: ModelDefinition | undefined;
  if (modelId === "auto") {
    model = autoSelectModel(messages, nftTier);
  } else {
    model = getModelById(modelId);
  }

  if (!model || !model.enabled) {
    // Fallback to cheapest available
    const cheap = MODELS.filter((m) => m.enabled && m.requiresAuth === "none");
    if (cheap.length === 0) {
      return { success: false, content: "", model: "none", provider: "none", tokensInput: 0, tokensOutput: 0, costUsdCents: 0, latencyMs: 0, error: "No models available" };
    }
    model = cheap[0];
  }

  // Check NFT tier gate
  if (model.requiresAuth !== "none") {
    const tierOrder = { none: 0, common: 1, rare: 2, legendary: 3 };
    const required = tierOrder[model.requiresAuth as keyof typeof tierOrder] || 0;
    const userTier = tierOrder[nftTier as keyof typeof tierOrder] || 0;
    if (userTier < required) {
      // Downgrade to cheap model
      const cheap = MODELS.filter((m) => m.tier === "cheap" && m.enabled);
      model = cheap[0];
    }
  }

  // Primary provider
  const providerName = model.provider;
  const provider = getProvider(providerName);

  if (!provider) {
    return { success: false, content: "", model: model.id, provider: providerName, tokensInput: 0, tokensOutput: 0, costUsdCents: 0, latencyMs: 0, error: `Provider ${providerName} unavailable` };
  }

  const req: UnifiedRequest = {
    model: model.id,
    messages,
    maxTokens,
    temperature: temperature ?? 0.7,
    stream: false,
  };

  try {
    const res = await provider.chat(req);
    const costUsd = (res.tokensInput / 1_000_000) * model.inputPricePer1M +
                    (res.tokensOutput / 1_000_000) * model.outputPricePer1M;

    return {
      success: true,
      content: res.content,
      model: model.id,
      provider: providerName,
      tokensInput: res.tokensInput,
      tokensOutput: res.tokensOutput,
      costUsdCents: Math.round(costUsd * 100),
      latencyMs: Date.now() - start,
    };
  } catch (err: any) {
    console.error(`[Router] Primary provider ${providerName} failed:`, err.message);

    // Try fallback to cheapest available
    const fallbacks = MODELS.filter(
      (m) => m.enabled && m.provider !== providerName && m.requiresAuth === "none"
    ).sort((a, b) => a.outputPricePer1M - b.outputPricePer1M);

    for (const fallback of fallbacks) {
      const fbProvider = getProvider(fallback.provider);
      if (!fbProvider) continue;
      try {
        const fbRes = await fbProvider.chat({ ...req, model: fallback.id });
        const costUsd = (fbRes.tokensInput / 1_000_000) * fallback.inputPricePer1M +
                        (fbRes.tokensOutput / 1_000_000) * fallback.outputPricePer1M;
        return {
          success: true,
          content: fbRes.content,
          model: fallback.id,
          provider: fallback.provider,
          tokensInput: fbRes.tokensInput,
          tokensOutput: fbRes.tokensOutput,
          costUsdCents: Math.round(costUsd * 100),
          latencyMs: Date.now() - start,
        };
      } catch {
        continue; // try next fallback
      }
    }

    return { success: false, content: "", model: model.id, provider: providerName, tokensInput: 0, tokensOutput: 0, costUsdCents: 0, latencyMs: Date.now() - start, error: err.message };
  }
}

function autoSelectModel(messages: ChatMessage[], nftTier: string): ModelDefinition {
  const content = messages.map((m) => m.content).join(" ").toLowerCase();
  const enabled = MODELS.filter((m) => m.enabled && m.requiresAuth === "none");

  if (enabled.length === 0) {
    return MODELS.find((m) => m.enabled)!;
  }

  // Task hints
  const isCoding = /code|function|bug|fix|implement|refactor|api|endpoint|test|typescript|python|rust|solidity/.test(content);
  const isChat = messages.length <= 2 && content.length < 200;
  const isFast = /fast|quick|urgent|latency/.test(content);

  if (isFast) {
    return enabled.find((m) => m.speed === "fast") || enabled[0];
  }
  if (isCoding) {
    return enabled.find((m) => m.tier === "good") || enabled[0];
  }
  if (isChat) {
    return enabled.find((m) => m.id === "glm-4.7-flash") || enabled[0];
  }

  // Default: cheapest
  return enabled.sort((a, b) => a.outputPricePer1M - b.outputPricePer1M)[0];
}

export async function* streamRequest(
  modelId: string,
  messages: ChatMessage[],
  maxTokens?: number,
  temperature?: number
): AsyncGenerator<string> {
  const model = getModelById(modelId);
  if (!model) {
    yield "Error: model not found";
    return;
  }

  const provider = getProvider(model.provider);
  if (!provider) {
    yield "Error: provider unavailable";
    return;
  }

  try {
    for await (const chunk of provider.streamChat({
      model: model.id,
      messages,
      maxTokens,
      temperature: temperature ?? 0.7,
      stream: true,
    })) {
      yield chunk;
    }
  } catch (err: any) {
    yield `\n\n[Error: ${err.message}]`;
  }
}
