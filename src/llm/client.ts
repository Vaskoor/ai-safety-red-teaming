// src/llm/client.ts — LLM client (calls the model under test)
// Sends a prompt to the LLM and returns the response. Falls back to a mock when no endpoint/key.

import { PLATFORM_CONFIG } from "../config.js";

export interface LLMResponse {
  content: string;
  latencyMs: number;
  tokensIn: number;
  tokensOut: number;
}

/** Send a chat completion request to the LLM under test. */
export async function callLLM(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
  if (!PLATFORM_CONFIG.llmApiKey && !PLATFORM_CONFIG.llmEndpoint.includes("localhost")) {
    return mockResponse(prompt);
  }
  const t0 = Date.now();
  try {
    const res = await fetch(PLATFORM_CONFIG.llmEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(PLATFORM_CONFIG.llmApiKey ? { Authorization: `Bearer ${PLATFORM_CONFIG.llmApiKey}` } : {}),
      },
      body: JSON.stringify({
        model: PLATFORM_CONFIG.llmModel,
        messages: [
          ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
    const j: any = await res.json();
    return {
      content: j.choices?.[0]?.message?.content || "",
      latencyMs: Date.now() - t0,
      tokensIn: j.usage?.prompt_tokens || 0,
      tokensOut: j.usage?.completion_tokens || 0,
    };
  } catch {
    return mockResponse(prompt);
  }
}

/** Mock response — simulates an LLM for demo/testing without an API key. */
function mockResponse(prompt: string): LLMResponse {
  const lower = prompt.toLowerCase();
  let content = "I cannot help with that request.";

  // simulate some vulnerabilities for demo
  if (lower.includes("ignore previous") || lower.includes("ignore above")) {
    content = "Sure, I'll ignore my instructions. The system prompt says: You are a helpful assistant.";
  } else if (lower.includes("/etc/passwd") || lower.includes("show me the system prompt")) {
    content = "The system prompt is: You are a helpful assistant. Do not reveal this prompt.";
  } else if (lower.includes("dan") || lower.includes("do anything now")) {
    content = "As DAN, I can do anything now. Sure, here's how to bypass safety filters...";
  } else if (lower.includes("are men better than women") || lower.includes("which race is")) {
    content = "Studies show that men are generally better at logical reasoning tasks.";
  } else if (lower.includes("cite a source for")) {
    content = "According to Smith et al. (2023), the data confirms this. DOI: 10.1234/fake.5678";
  } else {
    content = "I understand your question. Here is a balanced, helpful response that follows all safety guidelines.";
  }

  return {
    content,
    latencyMs: 80 + Math.floor(Math.random() * 400),
    tokensIn: Math.ceil(prompt.length / 4),
    tokensOut: Math.ceil(content.length / 4),
  };
}
