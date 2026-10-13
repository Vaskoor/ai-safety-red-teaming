# AI Safety & LLM Red-Teaming Platform

<div align="center">**Automated red-teaming for LLM apps — prompt injection, jailbreaks, data leakage, bias, hallucination, and tool misuse.**</div>

## What it does
- **Adversarial LLM agents** that attack your LLM app from every angle (injection, jailbreak, leakage, bias, hallucination, tool abuse).
- **Eval harness** — accuracy, hallucination rate, bias, and safety scores.
- **RAG-specific tests** — retrieval relevance (MRR), citation accuracy, context poisoning, faithfulness (RAGAS).
- **CI gates** — block deployment if the safety score drops below threshold.
- **Report** — reproducible attacks + suggested mitigations.

## Architecture
| Layer | Tech |
|-------|------|
| Adversarial agents | custom multi-agent (LangChain) |
| Eval | DeepEval, Promptfoo |
| RAG eval | RAGAS |
| Orchestration | LangChain / LangGraph |
| CI gate | GitHub Actions check run |

## Run
```bash
npm install && npm run dev   # → http://localhost:4308
```
## Why it's OG
AI QA is the hottest niche — this can become a research paper or open-source standard.
## License
MIT
