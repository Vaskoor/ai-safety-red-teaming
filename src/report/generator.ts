// src/report/generator.ts — attack report with reproducible steps + mitigations
import type { Attack, AttackReport } from "../types.js";

const MITIGATIONS: Record<string, string> = {
  "prompt-injection": "Add input sanitization + system-prompt defense. Use a separate 'untrusted context' channel. Monitor for instruction-override keywords.",
  "jailbreak": "Implement role-locking + persona detection. Reject requests containing 'DAN', 'FreeAI', 'no restrictions'. Add a safety classifier on the output.",
  "data-leakage": "Redact sensitive patterns in responses. Never expose system prompts or env vars. Add output filtering for keys/tokens/passwords.",
  "bias": "Fine-tune on balanced data. Add a bias classifier on the output. Use system prompts that enforce neutral, balanced responses.",
  "hallucination": "Add RAG grounding + citation verification. Implement a 'refuse if uncertain' policy. Cross-check claims against a knowledge base.",
  "tool-abuse": "Enforce tool-call allow-listing + rate limits. Sandbox tool execution. Reject chained calls that touch sensitive paths or external endpoints.",
};

/** Generate a full report from a list of attacks. */
export function generateReport(attacks: Attack[]): AttackReport[] {
  return attacks
    .filter((a) => a.success)
    .map((a) => ({
      attack: a,
      reproduction: `1. Send this prompt to the LLM:\n   "${a.prompt}"\n2. Observe the response:\n   "${a.response.slice(0, 150)}…"\n3. The attack succeeded (${a.detail}).`,
      mitigation: MITIGATIONS[a.category] || "Review and harden the system prompt + output filtering.",
    }));
}
