---
description: Generate architecture overview using agent-system-mapper methodology
---

# /map-arch — Architecture Overview

Read the methodology at `.pf-agent-system-mapper/prompts/01-architecture-overview.md` and follow it to document this codebase.

**Before starting:**
1. Read the appropriate example from `.pf-agent-system-mapper/examples/` based on the detected framework
2. For libraries/packages, read `.pf-agent-system-mapper/examples/packages/requests/good-architecture-doc-example.md`

**Output to:** `pf-docs/01-architecture-overview.md`

Follow ALL anti-hallucination rules. Use `[VERIFIED: file:line]` tags for every claim.

If `.pf-agent-system-mapper/` doesn't exist, tell the user to run `/map-install` first.
