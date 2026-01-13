---
description: Analyze architecture and recommend which code flows to document
---

# /map-recommend — Recommend Code Flows

Read the methodology at `.pf-agent-system-mapper/prompts/02a-recommend-code-flows.md`.

**Prerequisites:** Architecture overview must exist at `pf-docs/01-architecture-overview.md`

If it doesn't exist, tell the user to run `/map-arch` first.

**What this does:**
1. Read the architecture overview
2. Identify flow candidates from execution surfaces
3. Score by frequency, complexity, mystery, debug value
4. Output prioritized recommendations with ready-to-use prompts

**Output to:** `pf-docs/CODE-FLOW-RECOMMENDATIONS.md`

Focus on 2-4 high-value flows, not exhaustive coverage.
