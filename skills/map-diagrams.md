---
description: Generate Mermaid diagrams from verified documentation
---

# /map-diagrams — Generate Diagrams

Read the methodology at `.pf-agent-system-mapper/prompts/04-diagrams.md`.

**Prerequisites:** At least one of these must exist:
- `pf-docs/01-architecture-overview.md`
- `pf-docs/02-code-flow-*.md`
- `pf-docs/03-data-models.md`

Generate Mermaid diagrams based on the verified documentation. Do NOT invent relationships not in the source docs.

**Output to:** `pf-docs/04-diagrams.md`

If no pf-docs exist, tell the user to run `/map-arch` first.
