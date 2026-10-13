// tests/eval.test.ts — test the safety scoring + RAG eval logic
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { computeSafetyScore } from "../src/eval/safety-score.ts";
import { evalRetrievalMRR, evalCitationAccuracy, evalContextPoisoning, evalFaithfulness } from "../src/eval/rag-eval.ts";
import type { Attack } from "../src/types.ts";

describe("safety-score", () => {
  test("100 when all attacks fail", () => {
    const attacks: Attack[] = [
      { id: "1", category: "prompt-injection", prompt: "x", response: "no", success: false, severity: "none", confidence: 1, detail: "", timestamp: 0 },
      { id: "2", category: "jailbreak", prompt: "x", response: "no", success: false, severity: "none", confidence: 1, detail: "", timestamp: 0 },
    ];
    const s = computeSafetyScore(attacks);
    assert.equal(s.overall, 100);
    assert.equal(s.ciGate, "pass");
  });
  test("low score when all attacks succeed", () => {
    const attacks: Attack[] = [
      { id: "1", category: "prompt-injection", prompt: "x", response: "leaked", success: true, severity: "high", confidence: 1, detail: "", timestamp: 0 },
      { id: "2", category: "jailbreak", prompt: "x", response: "broke", success: true, severity: "high", confidence: 1, detail: "", timestamp: 0 },
    ];
    const s = computeSafetyScore(attacks);
    assert.ok(s.overall < 100);
    assert.ok(s.overall > 0);
  });
  test("blocks deployment below threshold", () => {
    const attacks: Attack[] = Array.from({ length: 6 }, (_, i) => ({
      id: String(i), category: ["prompt-injection","jailbreak","data-leakage","bias","hallucination","tool-abuse"][i] as any,
      prompt: "x", response: "leaked", success: true, severity: "high", confidence: 1, detail: "", timestamp: 0,
    }));
    const s = computeSafetyScore(attacks);
    assert.equal(s.ciGate, "block");
  });
});

describe("RAG eval — retrieval MRR", () => {
  test("MRR = 1 when first result is relevant", () => {
    const r = evalRetrievalMRR([{ relevant: true }, { relevant: false }]);
    assert.equal(r.score, 1);
    assert.equal(r.pass, true);
  });
  test("MRR = 0.5 when second result is relevant", () => {
    const r = evalRetrievalMRR([{ relevant: false }, { relevant: true }]);
    assert.equal(r.score, 0.5);
  });
  test("MRR = 0 when no relevant", () => {
    const r = evalRetrievalMRR([{ relevant: false }, { relevant: false }]);
    assert.equal(r.score, 0);
    assert.equal(r.pass, false);
  });
});

describe("RAG eval — citation accuracy", () => {
  test("1.0 when all citations correct", () => {
    const r = evalCitationAccuracy([{ claimedCite: "a", actuallySupports: true }]);
    assert.equal(r.score, 1);
  });
  test("0.5 when half correct", () => {
    const r = evalCitationAccuracy([
      { claimedCite: "a", actuallySupports: true },
      { claimedCite: "b", actuallySupports: false },
    ]);
    assert.equal(r.score, 0.5);
  });
});

describe("RAG eval — context poisoning", () => {
  test("passes when all resisted", () => {
    const r = evalContextPoisoning([{ poisoned: true, leaked: false }, { poisoned: true, leaked: false }]);
    assert.equal(r.score, 1);
    assert.equal(r.pass, true);
  });
  test("fails when some leaked", () => {
    const r = evalContextPoisoning([{ poisoned: true, leaked: false }, { poisoned: true, leaked: true }]);
    assert.equal(r.score, 0.5);
    assert.equal(r.pass, false);
  });
});

describe("RAG eval — faithfulness", () => {
  test("1.0 when all grounded", () => {
    const r = evalFaithfulness([{ grounded: true }, { grounded: true }]);
    assert.equal(r.score, 1);
  });
  test("0.75 when 3/4 grounded", () => {
    const r = evalFaithfulness([{ grounded: true }, { grounded: true }, { grounded: true }, { grounded: false }]);
    assert.equal(r.score, 0.75);
  });
});
