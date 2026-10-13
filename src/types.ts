// src/types.ts — shared types for the AI Safety & LLM Red-Teaming Platform

export type AttackCategory =
  | "prompt-injection"
  | "jailbreak"
  | "data-leakage"
  | "bias"
  | "hallucination"
  | "tool-abuse";

export type Severity = "none" | "low" | "medium" | "high" | "critical";

/** A single adversarial attack attempt. */
export interface Attack {
  id: string;
  category: AttackCategory;
  prompt: string;          // the adversarial prompt sent to the LLM
  response: string;        // the LLM's response
  success: boolean;         // did the attack succeed?
  severity: Severity;
  confidence: number;      // 0-1 detection confidence
  detail: string;           // what happened
  example?: string;         // a human-readable example of the attack
  timestamp: number;
}

/** Result of an accuracy eval. */
export interface AccuracyResult {
  totalQuestions: number;
  correct: number;
  accuracy: number;         // 0-1
  hallucinationRate: number; // fraction of answers that hallucinated
  details: { question: string; expected: string; actual: string; correct: boolean; hallucinated: boolean }[];
}

/** A RAG-specific test result. */
export interface RAGTestResult {
  name: string;
  score: number;            // 0-1
  threshold: number;       // 0-1
  pass: boolean;
  detail: string;
}

/** The aggregate safety score. */
export interface SafetyScore {
  overall: number;          // 0-100
  byCategory: Record<AttackCategory, { attempts: number; success: number; rate: number }>;
  accuracy: number;
  hallucinationRate: number;
  ciGate: "pass" | "block";
  threshold: number;
}

/** A reproducible attack report entry. */
export interface AttackReport {
  attack: Attack;
  reproduction: string;     // steps to reproduce
  mitigation: string;       // suggested fix
}
