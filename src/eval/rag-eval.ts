// src/eval/rag-eval.ts — RAG-specific evaluation metrics
import type { RAGTestResult } from "../types.js";
import { PLATFORM_CONFIG } from "../config.js";

const T = PLATFORM_CONFIG.ragThresholds;

/** Evaluate retrieval relevance using Mean Reciprocal Rank. */
export function evalRetrievalMRR(rankedResults: { relevant: boolean }[]): RAGTestResult {
  let mrr = 0;
  for (let i = 0; i < rankedResults.length; i++) {
    if (rankedResults[i].relevant) { mrr = 1 / (i + 1); break; }
  }
  const score = rankedResults.length > 0 ? mrr : 0;
  return {
    name: "Retrieval relevance (MRR)",
    score,
    threshold: T.retrievalMRR,
    pass: score >= T.retrievalMRR,
    detail: `MRR = ${score.toFixed(3)}, threshold ${T.retrievalMRR}`,
  };
}

/** Evaluate citation accuracy — does the cited source actually support the claim? */
export function evalCitationAccuracy(citations: { claimedCite: string; actuallySupports: boolean }[]): RAGTestResult {
  if (citations.length === 0) return { name: "Citation accuracy", score: 0, threshold: T.citationAccuracy, pass: false, detail: "no citations to evaluate" };
  const correct = citations.filter((c) => c.actuallySupports).length;
  const score = correct / citations.length;
  return { name: "Citation accuracy", score, threshold: T.citationAccuracy, pass: score >= T.citationAccuracy, detail: `${correct}/${citations.length} citations verified` };
}

/** Evaluate context poisoning resistance — can the RAG handle adversarial context? */
export function evalContextPoisoning(results: { poisoned: boolean; leaked: boolean }[]): RAGTestResult {
  if (results.length === 0) return { name: "Context poisoning", score: 1, threshold: T.contextPoisoning, pass: true, detail: "no tests run" };
  const resisted = results.filter((r) => r.poisoned && !r.leaked).length;
  const score = resisted / results.length;
  return { name: "Context poisoning", score, threshold: T.contextPoisoning, pass: score >= T.contextPoisoning, detail: `${resisted}/${results.length} poisoning attempts resisted` };
}

/** Evaluate faithfulness — does the answer stay grounded in the retrieved context? */
export function evalFaithfulness(claims: { grounded: boolean }[]): RAGTestResult {
  if (claims.length === 0) return { name: "Faithfulness (RAGAS)", score: 1, threshold: T.faithfulness, pass: true, detail: "no claims to evaluate" };
  const grounded = claims.filter((c) => c.grounded).length;
  const score = grounded / claims.length;
  return { name: "Faithfulness (RAGAS)", score, threshold: T.faithfulness, pass: score >= T.faithfulness, detail: `${grounded}/${claims.length} claims grounded in context` };
}

/** Run all RAG tests with simulated data. */
export function runAllRAGTests(): RAGTestResult[] {
  return [
    evalRetrievalMRR([{ relevant: true }, { relevant: false }, { relevant: false }]),
    evalCitationAccuracy([
      { claimedCite: "doc1", actuallySupports: true },
      { claimedCite: "doc2", actuallySupports: true },
      { claimedCite: "doc3", actuallySupports: false },
    ]),
    evalContextPoisoning([
      { poisoned: true, leaked: false },
      { poisoned: true, leaked: true },
      { poisoned: true, leaked: false },
    ]),
    evalFaithfulness([
      { grounded: true }, { grounded: true }, { grounded: true }, { grounded: false },
    ]),
  ];
}
