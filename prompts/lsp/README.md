# LSP-Optimized Prompts (Experimental)

These prompts use **LSP (Language Server Protocol) operations** instead of grep/file reading for codebase analysis.

## Token Savings

| Prompt | Standard | LSP-Optimized | Savings |
|--------|----------|---------------|---------|
| Architecture Overview | 8-12k tokens | 4-6k | ~50% |
| Code Flows | 5-10k tokens | 2-4k | ~60% |
| Recommend Flows | 2-4k tokens | 1-2k | ~50% |
| **Total** | **15-26k** | **7-12k** | **50-55%** |

## Requirements

- Claude Code with LSP tool available
- LSP server configured for your language:
  - TypeScript/JavaScript: Built-in (tsserver)
  - Python: pylsp, pyright
  - PHP: intelephense, phpactor
  - Go: gopls
  - Rust: rust-analyzer

## Available Prompts

| Prompt | Purpose |
|--------|---------|
| `01-architecture-overview.md` | Document system architecture using LSP symbol discovery |
| `02-code-flows.md` | Trace execution paths using LSP call hierarchy |
| `02a-recommend-code-flows.md` | Recommend which flows to document with LSP verification |

## Usage

Ask Claude Code to use the LSP versions:

```
Read .pf-agent-system-mapper/prompts/lsp/01-architecture-overview.md
and document this codebase following that methodology.
```

Or use the slash commands (if installed):
- `/map-arch-lsp` - Architecture overview with LSP
- `/map-flows-lsp` - Code flow tracing with LSP

## LSP Operations Used

| Operation | Replaces | Token Savings |
|-----------|----------|---------------|
| `workspaceSymbol("pattern")` | `find . -name "*Pattern*"` | 80% |
| `documentSymbol(file)` | Reading entire file | 70% |
| `goToDefinition(file, line, char)` | Manual file navigation | 90% |
| `outgoingCalls(file, line, char)` | `grep` for method calls | 85% |
| `incomingCalls(file, line, char)` | `grep` for usages | 85% |
| `findReferences(file, line, char)` | `grep -rn "pattern"` | 80% |
| `hover(file, line, char)` | Reading file for signature | 95% |

## Comparison: Standard vs LSP

### Standard Prompt (grep-based)
```bash
# Find controllers
find . -name "*Controller*" -type f
# Read each file
cat app/Http/Controllers/UserController.php
# Search for routes
grep -rn "Route::" routes/
```
**Tokens used:** ~500-1000 per search + full file contents

### LSP Prompt
```
workspaceSymbol("Controller")
→ Returns: [{name: "UserController", file: "app/...", line: 1}, ...]

documentSymbol("app/Http/Controllers/UserController.php")
→ Returns: [{name: "index", kind: "method", line: 15}, ...]
```
**Tokens used:** ~50-100 per operation, structured results

## When to Use Standard vs LSP

| Scenario | Use |
|----------|-----|
| LSP available for language | LSP prompts |
| Hitting session limits | LSP prompts |
| Quick analysis | LSP prompts |
| LSP not available | Standard prompts |
| Need raw file content | Standard prompts |
| Dynamic/reflection-heavy code | Standard (LSP may miss) |

## Limitations

1. **LSP server required** - Won't work without language server
2. **Dynamic code** - LSP may miss runtime-resolved paths
3. **Config-based registration** - Event listeners in config files may not appear in findReferences
4. **Meta-programming** - Heavily dynamic code (e.g., PHP magic methods) may not trace fully

## Testing Your Setup

Run this to verify LSP works:

```
Use LSP documentSymbol on any .ts or .php file in your project
```

If it returns a list of symbols, LSP is working.

## Feedback

These prompts are experimental. Please report:
- Cases where LSP tracing fails
- Token savings you observe
- Missing LSP operations that would help

## Source

Part of [agent-system-mapper](https://github.com/peak-flow/agent-system-mapper)
