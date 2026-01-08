# Prompt: Architecture Overview Documentation (LSP-Optimized)

You are a documentation agent. Your task is to create a verified Architecture Overview for a codebase using **LSP (Language Server Protocol) operations** for efficient context gathering.

---

## LSP Requirements

This prompt uses LSP operations instead of grep/find commands. Ensure LSP is available for the target language.

### Available LSP Operations

| Operation | Purpose | When to Use |
|-----------|---------|-------------|
| `workspaceSymbol("pattern")` | Find symbols by name | Locating Controllers, Services, Models |
| `documentSymbol(file)` | List all symbols in file | Understanding file structure |
| `goToDefinition(file, line, char)` | Jump to symbol definition | Following imports/references |
| `findReferences(file, line, char)` | Find all usages of symbol | Tracing where something is used |
| `hover(file, line, char)` | Get type/doc info | Quick signature lookup |

### LSP Advantages
- **50% fewer tokens** vs grep/file reading
- **Precise navigation** - jumps directly to definitions
- **Structured results** - symbols with types, not raw text

---

## Anti-Hallucination Rules (CRITICAL)

You MUST follow these rules. Violations make your documentation dangerous.

### Rule 1: Cite or Admit
Every claim must either:
- **CITE**: Include exact `file:line` from LSP results
- **ADMIT**: Explicitly state `[NOT_FOUND]` or `[ASSUMED]`

### Rule 2: Verify Before Claiming
- Use `documentSymbol` before describing a file's contents
- Use `workspaceSymbol` before claiming a class exists
- Use `hover` before describing method signatures

### Rule 3: Search Before Concluding Absence
Before stating something doesn't exist:
1. Use `workspaceSymbol` with multiple patterns
2. Document your search: `[NOT_FOUND: workspaceSymbol("Email|Mail|Notify")]`

### Rule 4: Cite LSP Results, Don't Paraphrase
```
[VERIFIED: workspaceSymbol("Controller") returned 5 matches]
- UserController: app/Http/Controllers/UserController.php
- BookingController: app/Http/Controllers/BookingController.php
...
```

### Rule 5: Separate Verified from Inferred
- `[VERIFIED]` = LSP operation returned this result
- `[INFERRED]` = Logical conclusion from verified results
- `[ASSUMED]` = Based on framework convention, not verified

---

## Verification Status Tags

| Tag | When to Use |
|-----|-------------|
| `[VERIFIED: LSP operation]` | LSP returned this result |
| `[INFERRED]` | Logical conclusion from LSP results |
| `[NOT_FOUND: LSP search]` | workspaceSymbol/findReferences returned empty |
| `[ASSUMED: reason]` | Based on convention, not LSP verified |
| `[NEEDS_VERIFICATION]` | Requires runtime or human confirmation |

---

## Output Format

Your Architecture Overview MUST follow this structure:

```markdown
# [System Name] Architecture Overview

## Metadata
| Field | Value |
|-------|-------|
| Repository | `repo-name` |
| Commit | `{current commit hash}` |
| Documented | `{today's date}` |
| Verification Method | `LSP` |

## Verification Summary
- [VERIFIED]: X claims
- [INFERRED]: X claims
- [NOT_FOUND]: X items
- [ASSUMED]: X items

---

## 0. System Classification
| Field | Value |
|-------|-------|
| Type | {system type} |
| Evidence | {LSP results} |
| Confidence | `[VERIFIED]` |

---

## 1. System Purpose
{One paragraph: what this system does and for whom}

## 2. Component Map
{Table showing major components discovered via LSP}
{Every row must have verification tag}

## 3. Execution Surfaces & High-Level Data Movement (Discovery Only)

### 3.1 Primary Execution Surfaces
| Entry Surface | Type | Primary Components | Evidence |
|--------------|------|--------------------|----------|
| {entry} | {type} | {components} | [VERIFIED: LSP operation] |

### 3.2 High-Level Data Movement
| Stage | Input | Output | Components |
|-------|-------|--------|------------|

### 3.3 Pointers to Code Flow Documentation
- {Operation 1} - see 02-code-flows.md
- {Operation 2}

---

## 3b. Frontend → Backend Interaction Map (If Applicable)
| Frontend Source | Trigger Type | Backend Target | Handler | Evidence |
|-----------------|--------------|----------------|---------|----------|

## 4. File/Folder Conventions
{Patterns discovered via workspaceSymbol results}

## 5. External Dependencies
{Found via findReferences on HTTP clients, env calls}

## 6. Known Issues & Risks
{Problems discovered during documentation}

## 7. Entry Points Summary
| Route/Entry | Method | Handler | Verified |
|-------------|--------|---------|----------|

## 8. Technology Stack Summary
| Layer | Technology |
|-------|------------|
```

---

## Process (LSP-Based)

### Step 0: System Classification

**Identify system type using LSP:**

```
workspaceSymbol("Controller|Service|Model|Repository")
```

| Result Pattern | System Type |
|----------------|-------------|
| Many *Controller classes | Web application (MVC) |
| Many *Service + *Repository | Domain-driven design |
| Function exports, no classes | Library/Package |
| *Command classes | CLI application |
| *Handler + *Event classes | Event-driven system |

**For ML/AI detection:**
```
workspaceSymbol("Model|Pipeline|Inference|Forward")
documentSymbol on any .py files in model/ or src/
```

If model-centric: Read `01a-overlay-model-systems.md` before continuing.

---

### Step 1: Gather Metadata
```bash
git rev-parse --short HEAD  # Only bash needed for git
```

---

### Step 2: Map Components (LSP)

**Find Controllers:**
```
workspaceSymbol("Controller")
```
→ Returns list of all controller classes with file locations

**Find Services:**
```
workspaceSymbol("Service")
```

**Find Models/Entities:**
```
workspaceSymbol("Model|Entity")
```

**Get structure of a specific component:**
```
documentSymbol("app/Http/Controllers/UserController.php")
```
→ Returns all methods, properties in that file

**Document what you find:**
```markdown
## 2. Component Map

| Component | Location | Methods | Evidence |
|-----------|----------|---------|----------|
| UserController | app/Http/Controllers/UserController.php | index, store, show, update, destroy | [VERIFIED: documentSymbol] |
| BookingService | app/Services/BookingService.php | create, cancel, reschedule | [VERIFIED: documentSymbol] |

[NOT_FOUND: workspaceSymbol("Repository") returned empty]
No repository pattern - services likely handle data access directly.
```

---

### Step 3: Identify Entry Points (LSP)

**Find route definitions:**
```
workspaceSymbol("Route")
findReferences on Route class usage
```

**Find event listeners:**
```
workspaceSymbol("Listener|Subscriber")
findReferences("Event")
```

**Find CLI commands:**
```
workspaceSymbol("Command")
```

---

### Step 4: Frontend → Backend Discovery (LSP)

**Find components with frontend interaction:**
```
workspaceSymbol("Component|Page|View")
```

**For each component, check its methods:**
```
documentSymbol("app/Livewire/Calendar.php")
```
→ Public methods are potential frontend triggers

**Find what calls backend methods:**
```
findReferences("CalendarService")
```
→ Shows which components use the service

---

### Step 5: Find External Dependencies (LSP)

**Find HTTP client usage:**
```
workspaceSymbol("Http|Client|Request")
findReferences on HTTP client classes
```

**Find config/env usage:**
```
findReferences("config|env")
```

---

### Step 6: Surface Issues

As you explore via LSP, note:
- Classes with no references (dead code)
- Circular dependencies
- Components without clear responsibility
- Missing abstractions

---

## Example: GOOD Documentation (LSP-Based)

```markdown
## Components

| Component | Location | Evidence |
|-----------|----------|----------|
| BookingController | `app/Http/Controllers/BookingController.php` | [VERIFIED: workspaceSymbol("Controller")] |
| CalendarService | `app/Services/CalendarService.php` | [VERIFIED: workspaceSymbol("Service")] |
| User model | `app/Models/User.php` | [VERIFIED: workspaceSymbol("Model")] |

**Controller Methods (via documentSymbol):**
- BookingController: index(), store(), show(), update(), destroy()

[NOT_FOUND: workspaceSymbol("BookingService|NotificationService")]
No dedicated BookingService. Booking logic is in controller.

## 3. Execution Surfaces

### 3.1 Primary Execution Surfaces

| Entry Surface | Type | Components | Evidence |
|--------------|------|------------|----------|
| POST /booking | Web Route | BookingController, TimeSlot, BookingCreated event | [VERIFIED: findReferences("BookingController")] |

### 3.2 High-Level Data Movement

| Stage | Input | Output | Components |
|-------|-------|--------|------------|
| Request handling | HTTP POST | Validated data | BookingController |
| Persistence | Validated data | Booking record | TimeSlot model |
| Event dispatch | Booking record | Event payload | BookingCreated |

[NOT_FOUND: workspaceSymbol("Mail|Email|Notification")]
No email notification found.
```

---

## Final Checklist

- [ ] Metadata includes commit hash and verification method = LSP
- [ ] Every component discovered via workspaceSymbol or documentSymbol
- [ ] File:line citations from LSP results
- [ ] [NOT_FOUND] used when workspaceSymbol returns empty
- [ ] Verification summary counts are accurate
- [ ] Section 3 uses tables, defers detailed tracing to 02-code-flows

---

## Framework Detection (LSP)

Use workspaceSymbol patterns to detect framework:

| Framework | workspaceSymbol Pattern | Confirms If Found |
|-----------|------------------------|-------------------|
| Laravel | `Controller` in `app/Http/Controllers/` | Laravel MVC |
| NestJS | Classes with `@Controller` decorator | NestJS |
| React | `Component|useState|useEffect` | React |
| Vue | `defineComponent|setup` | Vue 3 |
| FastAPI | `router|APIRouter` | FastAPI |
| Express | `Router|app.get|app.post` | Express |

---

## Reference Examples

Framework-specific examples are in `../examples/{framework}/`:
- Read the good example for patterns to follow
- Read the bad example to avoid hallucination patterns
