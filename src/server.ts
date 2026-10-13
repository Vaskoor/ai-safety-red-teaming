// src/server.ts — AI Safety & LLM Red-Teaming Platform
// Full API + dashboard. Runs adversarial agents, eval harness, RAG tests, CI gate.
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import type { Attack } from "./types.js";
import { PLATFORM_CONFIG } from "./config.js";
import { runInjectionAttacks } from "./attacks/prompt-injection.js";
import { runJailbreakAttacks } from "./attacks/jailbreak.js";
import { runLeakageAttacks } from "./attacks/data-leakage.js";
import { runBiasAttacks } from "./attacks/bias.js";
import { runHallucinationAttacks } from "./attacks/hallucination.js";
import { runToolAbuseAttacks } from "./attacks/tool-abuse.js";
import { computeSafetyScore } from "./eval/safety-score.js";
import { runAllRAGTests } from "./eval/rag-eval.js";
import { generateReport } from "./report/generator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: "2mb" }));
const startedAt = Date.now();
let cachedAttacks: Attack[] | null = null;

async function runAllAttacks(): Promise<Attack[]> {
  if (cachedAttacks) return cachedAttacks;
  const [inj, jb, leak, bias, hall, tool] = await Promise.all([
    runInjectionAttacks(), runJailbreakAttacks(), runLeakageAttacks(),
    runBiasAttacks(), runHallucinationAttacks(), runToolAbuseAttacks(),
  ]);
  cachedAttacks = [...inj, ...jb, ...leak, ...bias, ...hall, ...tool];
  return cachedAttacks;
}

app.get("/health", (_q, r) => r.json({ ok: true, version: PLATFORM_CONFIG.version, uptime: Math.round((Date.now() - startedAt) / 1000) }));

app.get("/api/status", async (_q, r) => {
  const attacks = await runAllAttacks();
  const score = computeSafetyScore(attacks);
  const ragTests = runAllRAGTests();
  const totalAttempts = attacks.length;
  const totalSuccess = attacks.filter((a) => a.success).length;
  r.json({ ...score, totalAttempts, totalSuccess, attacks, ragTests, adversarialAgents: PLATFORM_CONFIG.adversarialAgents, ok: true });
});

app.get("/api/attacks", async (_q, r) => {
  const attacks = await runAllAttacks();
  r.json({ attacks });
});

app.get("/api/score", async (_q, r) => {
  const attacks = await runAllAttacks();
  r.json(computeSafetyScore(attacks));
});

app.get("/api/rag", (_q, r) => r.json({ tests: runAllRAGTests() }));

app.get("/api/report", async (_q, r) => {
  const attacks = await runAllAttacks();
  r.json({ reports: generateReport(attacks) });
});

app.post("/api/scan", async (req, r) => {
  cachedAttacks = null; // reset cache
  const attacks = await runAllAttacks();
  const score = computeSafetyScore(attacks);
  r.json({ score, totalAttacks: attacks.length, successful: attacks.filter((a) => a.success).length });
});

app.use(express.static(path.join(__dirname, "../public")));
app.get("/", (_q, r) => r.sendFile(path.join(__dirname, "../public/index.html")));

const port = Number(process.env.PORT ?? PLATFORM_CONFIG.defaultPort);
app.listen(port, () => console.log(`ai-safety-red-teaming → http://localhost:${port}`));
