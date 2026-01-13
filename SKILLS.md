# Agent System Mapper - Claude Code Skills

This document explains how to install and use the Claude Code slash commands (skills) for agent-system-mapper.

## Quick Install

### Option 1: Copy Skills Manually

Copy the skill files from `skills/` to your Claude Code commands directory:

```bash
# Create commands directory if it doesn't exist
mkdir -p ~/.claude/commands

# Copy all map-* skills
cp skills/map-*.md ~/.claude/commands/
```

### Option 2: Use the Install Script

```bash
# Install prompts AND skills
curl -sL "https://raw.githubusercontent.com/peak-flow/agent-system-mapper/master/install.sh" | bash

# Then copy skills
curl -sL "https://raw.githubusercontent.com/peak-flow/agent-system-mapper/master/install-skills.sh" | bash
```

---

## Available Skills

| Skill | Description | Prerequisites |
|-------|-------------|---------------|
| `/map-install` | Install prompts to current project | None |
| `/map-arch` | Generate architecture overview | Prompts installed |
| `/map-arch-lsp` | Architecture overview (LSP, 50% fewer tokens) | Prompts + LSP server |
| `/map-flows [name]` | Document a specific code flow | Architecture doc |
| `/map-flows-lsp [name]` | Code flow (LSP, 60% fewer tokens) | Architecture doc + LSP |
| `/map-recommend` | Recommend which flows to document | Architecture doc |
| `/map-data` | Document data models and schema | Prompts installed |
| `/map-diagrams` | Generate Mermaid diagrams | At least one doc exists |
| `/map-tests` | Derive test candidates from flows | Code flow doc |

---

## Skill Workflow

The recommended workflow is:

```
1. /map-install          → Install prompts to project
         ↓
2. /map-arch             → Document architecture (or /map-arch-lsp)
         ↓
3. /map-recommend        → Get prioritized list of flows to document
         ↓
4. /map-flows [name]     → Document each recommended flow (or /map-flows-lsp)
         ↓
5. /map-data             → Document data models
         ↓
6. /map-diagrams         → Generate visual diagrams
         ↓
7. /map-tests            → Derive test candidates from flows
```

---

## Skill Details

### /map-install

Installs the agent-system-mapper prompts to `.pf-agent-system-mapper/` in the current directory.

**Usage:**
```
/map-install
```

**What it does:**
1. Downloads prompts from GitHub
2. Creates `.pf-agent-system-mapper/prompts/` with methodology files
3. Creates `.pf-agent-system-mapper/examples/` with framework examples

---

### /map-arch

Generates a comprehensive architecture overview of the codebase.

**Usage:**
```
/map-arch
```

**Output:** `pf-docs/01-architecture-overview.md`

**What it documents:**
- System classification (web app, library, CLI, etc.)
- Component map (controllers, services, models)
- Execution surfaces (routes, commands, listeners)
- External dependencies
- Technology stack

---

### /map-arch-lsp

Same as `/map-arch` but uses LSP operations for ~50% fewer tokens.

**Usage:**
```
/map-arch-lsp
```

**Requirements:** LSP server running for the target language

**Key differences:**
- Uses `workspaceSymbol` instead of `find`
- Uses `documentSymbol` instead of reading files
- Discovery only - no execution tracing

---

### /map-flows

Documents a specific code execution path step-by-step.

**Usage:**
```
/map-flows                    # Will ask which flow
/map-flows user-registration  # Document specific flow
```

**Output:** `pf-docs/02-code-flow-{name}.md`

**What it documents:**
- Entry point and trigger
- Step-by-step execution with file:line citations
- Data shapes at each step
- Events fired and listeners
- External calls

---

### /map-flows-lsp

Same as `/map-flows` but uses LSP call hierarchy for ~60% fewer tokens.

**Usage:**
```
/map-flows-lsp checkout-flow
```

**Requirements:** LSP server with call hierarchy support

**Key differences:**
- Uses `outgoingCalls` to discover call chains
- Uses `goToDefinition` to jump between methods
- Uses `findReferences` for event listeners

---

### /map-recommend

Analyzes the architecture and recommends which code flows are worth documenting.

**Usage:**
```
/map-recommend
```

**Prerequisites:** `/map-arch` must have been run first

**Output:** `pf-docs/CODE-FLOW-RECOMMENDATIONS.md`

**What it does:**
- Reads architecture overview
- Scores flows by frequency, complexity, mystery, debug value
- Outputs 2-4 high-priority recommendations
- Provides ready-to-use prompts for each

---

### /map-data

Documents the data layer: tables, models, relationships.

**Usage:**
```
/map-data
```

**Output:** `pf-docs/03-data-models.md`

**What it documents:**
- Database tables/collections
- Model relationships (hasMany, belongsTo, etc.)
- Validation rules
- Indexes and constraints
- Schema drift between migrations and models

---

### /map-diagrams

Generates Mermaid diagrams from existing documentation.

**Usage:**
```
/map-diagrams
```

**Prerequisites:** At least one pf-docs file must exist

**Output:** `pf-docs/04-diagrams.md`

**Diagram types:**
- Component diagram (from architecture)
- Sequence diagrams (from code flows)
- ERD (from data models)

---

### /map-tests

Derives test candidates from documented code flows.

**Usage:**
```
/map-tests
```

**Prerequisites:** `/map-flows` must have been run first

**Output:** `pf-docs/05-test-surface-{flow-name}.md`

**What it produces:**
- Observable outcomes to test
- Invariants that must hold
- Failure modes to cover
- Prioritized test candidates (5-10, not 30)

**Important:** Produces test *candidates*, not test code.

---

## Standard vs LSP Skills

| Aspect | Standard (`/map-arch`) | LSP (`/map-arch-lsp`) |
|--------|------------------------|----------------------|
| Token usage | 15-26k | 7-12k |
| Requirements | None | LSP server |
| Best for | All languages | TypeScript, Python, PHP |
| Tradeoff | Works everywhere | 50% fewer tokens |

Use LSP versions when:
- Hitting session limits
- LSP server available for your language
- Need faster analysis

Use standard versions when:
- No LSP server available
- Dynamic/meta-programming heavy code
- LSP can't resolve symbols

---

## Creating Custom Skills

Skills are markdown files in `~/.claude/commands/`. Format:

```markdown
---
description: Short description shown in skill list
---

# /skill-name — Title

Instructions for the AI to follow...

**Output to:** `path/to/output.md`

If prerequisites not met, tell user what to do.
```

### Skill Best Practices

1. **Clear prerequisites** - State what must exist before running
2. **Explicit output path** - Tell AI where to write results
3. **Fallback instructions** - What to do if something is missing
4. **Anti-hallucination** - Require `[VERIFIED: source]` tags
5. **Scope boundaries** - Don't let one skill do another's job

---

## Troubleshooting

### Skill not appearing in Claude Code

1. Check file is in `~/.claude/commands/`
2. Restart Claude Code session
3. Verify YAML frontmatter is valid

### /map-install fails

1. Check network connection
2. Try running curl command manually in terminal
3. Check if sandbox is blocking network access

### LSP skills not working

1. Verify LSP server is running for your language
2. Try `documentSymbol` on a file to test
3. Fall back to standard (non-LSP) skill

---

## File Locations

| Item | Location |
|------|----------|
| Skills (user) | `~/.claude/commands/map-*.md` |
| Prompts (project) | `.pf-agent-system-mapper/prompts/` |
| LSP prompts | `.pf-agent-system-mapper/prompts/lsp/` |
| Examples | `.pf-agent-system-mapper/examples/` |
| Output | `pf-docs/` |

---

## Source

Part of [agent-system-mapper](https://github.com/peak-flow/agent-system-mapper)
