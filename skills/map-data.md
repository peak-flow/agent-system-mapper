---
description: Document data models and schema using agent-system-mapper methodology
---

# /map-data — Data Model Documentation

Read the methodology at `.pf-agent-system-mapper/prompts/03-data-models.md` and follow it to document the data layer.

**Output to:** `pf-docs/03-data-models.md`

Document:
- Database tables/collections
- Model relationships
- Validation rules
- Indexes and constraints

Follow ALL anti-hallucination rules. Use `[VERIFIED: file:line]` tags for every claim.

If `.pf-agent-system-mapper/` doesn't exist, tell the user to run `/map-install` first.
