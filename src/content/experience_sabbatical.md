An intentional period of independent engineering, focused on shipping production-grade projects, modernizing backend workflows, and integrating privacy-first AI tooling. Key activities include:

- **AI Data Pipelines:** Architected the [basepaint archive](https://github.com/isaacbernat/basepaint) using a production-grade custom Python orchestrator to manage resilient LLM ingestion. Features robust concurrency control with rate limiting and exponential backoff (`tenacity`, `asyncio`) and strict data validation (`pydantic`) to handle stochastic AI outputs.

- **Agentic CI/CD Engineering:** Modernized the popular [netflix-to-srt](https://github.com/isaacbernat/netflix-to-srt) open-source tool (**850+ GitHub Stars**) via AI orchestration. This involved hosting distilled LLMs (Qwen3.5) locally in Orbstack containers to ensure a zero-data-leakage environment for generating multi-language unit tests (Python `unittest` & `node:test`) while keeping strict zero-dependency constraints.

- **Hardware-Constrained Polyglot:** Engineered a unique 50 FPS real-time asymmetric multiplayer game in **Lua** for the Playdate console. Designed a custom particle system with object pooling (300+ independently moving particles with zero Garbage Collector churn). Officially selected for publication in the curated Playdate console Catalog.

- **System Design:** Authored a comprehensive, production-level technical design for a [heuristic-based Spam Classification Engine](#system-design), a pragmatic approach to building resilient features within legacy ecosystems.

_A curated selection of **[GitHub Projects](#personal-open-source-projects)** from this period is detailed below._
