// ── Provider Adapters ──
// Normalizes each provider's API to OpenAI-compatible format.
import OpenAI from "openai";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface UnifiedRequest {
  model: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface UnifiedResponse {
  id: string;
  model: string;
  content: string;
  tokensInput: number;
  tokensOutput: number;
  finishReason: string;
}

export interface ProviderAdapter {
  name: string;
  chat(req: UnifiedRequest): Promise<UnifiedResponse>;
  streamChat(req: UnifiedRequest): AsyncGenerator<string>;
}

// ── DeepSeek Adapter ──
function getDeepSeek(): OpenAI {
  return new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: process.env.DEEPSEEK_API_KEY!,
  });
}

const deepseekAdapter: ProviderAdapter = {
  name: "deepseek",
  async chat(req) {
    const client = getDeepSeek();
    const res = await client.chat.completions.create({
      model: req.model,
      messages: req.messages,
      max_tokens: req.maxTokens,
      temperature: req.temperature,
      stream: false,
    });
    const choice = res.choices[0];
    return {
      id: res.id,
      model: res.model,
      content: choice.message.content || "",
      tokensInput: res.usage?.prompt_tokens || 0,
      tokensOutput: res.usage?.completion_tokens || 0,
      finishReason: choice.finish_reason || "stop",
    };
  },
  async *streamChat(req) {
    const client = getDeepSeek();
    const stream = await client.chat.completions.create({
      model: req.model,
      messages: req.messages,
      max_tokens: req.maxTokens,
      temperature: req.temperature,
      stream: true,
    });
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  },
};

// ── Groq Adapter ──
function getGroq(): OpenAI {
  return new OpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY!,
  });
}

const groqAdapter: ProviderAdapter = {
  name: "groq",
  async chat(req) {
    const client = getGroq();
    const res = await client.chat.completions.create({
      model: req.model === "groq-llama-3.1-8b" ? "llama-3.1-8b-instant" : req.model,
      messages: req.messages,
      max_tokens: req.maxTokens,
      temperature: req.temperature,
      stream: false,
    });
    const choice = res.choices[0];
    return {
      id: res.id,
      model: res.model,
      content: choice.message.content || "",
      tokensInput: res.usage?.prompt_tokens || 0,
      tokensOutput: res.usage?.completion_tokens || 0,
      finishReason: choice.finish_reason || "stop",
    };
  },
  async *streamChat(req) {
    const client = getGroq();
    const stream = await client.chat.completions.create({
      model: req.model === "groq-llama-3.1-8b" ? "llama-3.1-8b-instant" : req.model,
      messages: req.messages,
      max_tokens: req.maxTokens,
      temperature: req.temperature,
      stream: true,
    });
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  },
};

// ── DeepInfra Adapter ──
function getDeepInfra(): OpenAI {
  return new OpenAI({
    baseURL: "https://api.deepinfra.com/v1/openai",
    apiKey: process.env.DEEPINFRA_API_KEY!,
  });
}

const deepinfraAdapter: ProviderAdapter = {
  name: "deepinfra",
  async chat(req) {
    const client = getDeepInfra();
    const modelMap: Record<string, string> = {
      "llama-3.3-70b": "meta-llama/Llama-3.3-70B-Instruct",
    };
    const res = await client.chat.completions.create({
      model: modelMap[req.model] || req.model,
      messages: req.messages,
      max_tokens: req.maxTokens,
      temperature: req.temperature,
      stream: false,
    });
    const choice = res.choices[0];
    return {
      id: res.id,
      model: res.model,
      content: choice.message.content || "",
      tokensInput: res.usage?.prompt_tokens || 0,
      tokensOutput: res.usage?.completion_tokens || 0,
      finishReason: choice.finish_reason || "stop",
    };
  },
  async *streamChat(req) {
    const client = getDeepInfra();
    const modelMap: Record<string, string> = {
      "llama-3.3-70b": "meta-llama/Llama-3.3-70B-Instruct",
    };
    const stream = await client.chat.completions.create({
      model: modelMap[req.model] || req.model,
      messages: req.messages,
      max_tokens: req.maxTokens,
      temperature: req.temperature,
      stream: true,
    });
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  },
};

// ── Gemini Adapter (via OpenAI compat endpoint) ──
function getGemini(): OpenAI {
  return new OpenAI({
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
    apiKey: process.env.GEMINI_API_KEY!,
  });
}

const geminiAdapter: ProviderAdapter = {
  name: "google",
  async chat(req) {
    const client = getGemini();
    const modelMap: Record<string, string> = {
      "gemini-3-flash": "gemini-2.0-flash",
      "gemini-3.1-flash-lite": "gemini-1.5-flash",
    };
    const res = await client.chat.completions.create({
      model: modelMap[req.model] || "gemini-2.0-flash",
      messages: req.messages,
      max_tokens: req.maxTokens,
      temperature: req.temperature,
      stream: false,
    });
    const choice = res.choices[0];
    return {
      id: res.id,
      model: res.model,
      content: choice.message.content || "",
      tokensInput: res.usage?.prompt_tokens || 0,
      tokensOutput: res.usage?.completion_tokens || 0,
      finishReason: choice.finish_reason || "stop",
    };
  },
  async *streamChat(req) {
    const client = getGemini();
    const modelMap: Record<string, string> = {
      "gemini-3-flash": "gemini-2.0-flash",
      "gemini-3.1-flash-lite": "gemini-1.5-flash",
    };
    const stream = await client.chat.completions.create({
      model: modelMap[req.model] || "gemini-2.0-flash",
      messages: req.messages,
      max_tokens: req.maxTokens,
      temperature: req.temperature,
      stream: true,
    });
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  },
};

// ── Z.AI GLM Adapter (free tier, no auth needed for 4.7 Flash) ──
function getZai(): OpenAI {
  return new OpenAI({
    baseURL: "https://api.z.ai/api/paas/v4",
    apiKey: process.env.ZAI_API_KEY || "free", // GLM 4.7 Flash is free
  });
}

const zaiAdapter: ProviderAdapter = {
  name: "zai",
  async chat(req) {
    const client = getZai();
    const res = await client.chat.completions.create({
      model: "glm-4-flash", // GLM-4.7 Flash
      messages: req.messages,
      max_tokens: req.maxTokens || 4096,
      temperature: req.temperature || 0.7,
      stream: false,
    });
    const choice = res.choices[0];
    return {
      id: res.id,
      model: "glm-4.7-flash",
      content: choice.message.content || "",
      tokensInput: res.usage?.prompt_tokens || 0,
      tokensOutput: res.usage?.completion_tokens || 0,
      finishReason: choice.finish_reason || "stop",
    };
  },
  async *streamChat(req) {
    const client = getZai();
    const stream = await client.chat.completions.create({
      model: "glm-4-flash",
      messages: req.messages,
      max_tokens: req.maxTokens || 4096,
      temperature: req.temperature || 0.7,
      stream: true,
    });
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  },
};

// ── Provider registry ──
const providerRegistry: Record<string, ProviderAdapter> = {
  deepseek: deepseekAdapter,
  groq: groqAdapter,
  deepinfra: deepinfraAdapter,
  google: geminiAdapter,
  zai: zaiAdapter,
};

export function getProvider(name: string): ProviderAdapter | undefined {
  return providerRegistry[name];
}

export function getAvailableProviders(): string[] {
  return Object.keys(providerRegistry).filter((p) => {
    switch (p) {
      case "deepseek": return !!process.env.DEEPSEEK_API_KEY;
      case "groq": return !!process.env.GROQ_API_KEY;
      case "deepinfra": return !!process.env.DEEPINFRA_API_KEY;
      case "google": return !!process.env.GEMINI_API_KEY;
      case "zai": return !!process.env.ZAI_API_KEY;
      default: return false;
    }
  });
}

export function getProviderForModel(modelId: string): string | undefined {
  return MODELS_BY_PROVIDER[modelId];
}

const MODELS_BY_PROVIDER: Record<string, string> = {
  "deepseek-v4-flash": "deepseek",
  "llama-3.3-70b": "deepinfra",
  "groq-llama-3.1-8b": "groq",
  "glm-4.7-flash": "zai",
  "gemini-3-flash": "google",
  "gemini-3.1-flash-lite": "google",
  "minimax-m3": "minimax",
};
