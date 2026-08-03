---
description: Document data models and schema using agent-system-mapper methodology. Use when the user asks to document data models, database schema, tables, migrations, or ORM relationships.
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

**After writing:** run `python3 .pf-agent-system-mapper/verify.py pf-docs/03-data-models.md` and fix the doc until it exits 0 (PASS).

If `.pf-agent-system-mapper/` doesn't exist, tell the user to run `/map-install` first.
