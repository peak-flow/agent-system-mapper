# Guide: Architecture Overview Documentation

**Purpose:** How to create a verified, anti-hallucination architecture overview that AI agents and developers can trust and act upon.

---

## What is an Architecture Overview?

An Architecture Overview answers: **"How is this system organized and how do its parts connect?"**

It is NOT:
- A tutorial on how to use the system
- A detailed code walkthrough
- An API reference

It IS:
- A map of components and their responsibilities
- How data flows between components
- Where to find things (file/folder conventions)
- Key integration points and boundaries

---

## Anti-Hallucination Principles

### The Core Problem

AI agents (and humans documenting unfamiliar code) commonly:
1. Describe code that doesn't exist
2. Assume behavior based on naming conventions
3. State relationships without verifying them
4. Conflate "what it looks like" with "what it does"

### The Solution: Cite or Admit

Every claim in your documentation must either:
- **CITE**: Reference exact file:line with quoted code
- **ADMIT**: Explicitly state "not found" or "assumed"

There is no middle ground. Vague descriptions without citations are hallucination-prone.

---

## Verification Status Tags

Use these tags consistently:

| Tag | Meaning | Example |
|-----|---------|---------|
| `[VERIFIED: path:line]` | Code exists exactly as described | `[VERIFIED: app/Models/User.php:15-18]` |
| `[INFERRED]` | Logical conclusion from verified code | Framework convention, return type implies behavior |
| `[NOT_FOUND]` | Searched but couldn't locate | `[NOT_FOUND: searched "email" in app/]` |
| `[ASSUMED]` | Based on convention, not verified | `[ASSUMED: Laravel convention]` |
| `[NEEDS_VERIFICATION]` | Requires runtime/human confirmation | External API behavior, env-dependent logic |

---

## Architecture Overview Template

```markdown
# [System Name] Architecture Overview

## Metadata
| Field | Value |
|-------|-------|
| Repository | `repo-name` |
| Commit | `abc1234` |
| Documented | `YYYY-MM-DD` |
| Verification Status | `Draft` / `Verified` / `Needs Review` |

## Verification Summary
- [VERIFIED]: X claims
- [INFERRED]: X claims
- [NOT_FOUND]: X items
- [ASSUMED]: X items

---

## 1. System Purpose
One paragraph: what does this system do and for whom?

## 2. Component Map
Table or diagram showing major components and their roles.

## 3. Data Flow
How data moves through the system for key operations.

## 4. File/Folder Conventions
Where to find what. Patterns used.

## 5. External Dependencies
APIs, services, packages the system relies on.

## 6. Key Boundaries
Where the system starts/ends. Integration points.

## 7. Known Issues & Risks
Documented problems, technical debt, inconsistencies found.
```

---

## Step-by-Step Process

### Step 1: Establish Metadata

Before documenting anything:
1. Get the current commit hash: `git rev-parse HEAD`
2. Note the date
3. Set status to "Draft"

This ensures your documentation can be verified against a specific code state.

### Step 2: Map the File Structure

Run these commands and document what you find:

```bash
# Get folder structure
tree -L 3 -d

# Find key file patterns
find . -name "*.php" -type f | head -20
find . -name "*Controller*" -type f
find . -name "*Service*" -type f
find . -name "*Model*" -type f
```

For each folder, document:
- What belongs there (with verification tag)
- What pattern determines file placement

### Step 3: Identify Entry Points

Entry points are where external input enters your code:
- HTTP routes
- CLI commands
- Queue workers
- Event listeners
- Scheduled tasks

Search for them:
```bash
# Routes
grep -rn "Route::" routes/

# Commands
find . -path "*/Commands/*.php" -type f

# Event listeners
grep -rn "protected \$listen" app/
```

Document each with file:line citation.

### Step 4: Trace Key Flows

For 2-3 representative operations:
1. Start at entry point
2. Follow the call chain
3. Note each component touched
4. Document where data transforms

Use the format:
```
Entry → Controller → Service → Model → Event → Listener → External
```

Each arrow should be verifiable with file:line.

### Step 5: Document External Dependencies

Search for:
```bash
# HTTP calls
grep -rn "Http::" app/

# External packages
cat composer.json | jq '.require'

# Environment dependencies
grep -rn "env(" app/ config/
```

For each external dependency:
- What it is
- Where it's configured
- Where it's called from

### Step 6: Surface Issues and Risks

As you explore, note:
- Code that contradicts itself
- Hardcoded values that should be config
- Missing error handling
- Duplicated logic
- Dead code or unused config

These become the "Known Issues" section.

### Step 7: Verify and Finalize

1. Re-read each claim
2. Ensure every claim has appropriate tag
3. Update verification summary counts
4. Change status to "Verified" only if all claims checked

---

## Examples

See the `examples/` folder for:
- **[BAD Example](../examples/laravel/bad-architecture-doc-example.md)** - Vague, no citations, assumes behavior
- **[GOOD Example](../examples/laravel/good-architecture-doc-example.md)** - Verified, cited, shows actual code

Both document the same codebase (`slotbooker/`) so you can directly compare.

---

## Common Mistakes to Avoid

### Mistake 1: Describing Instead of Citing

**Bad:**
> The UserService handles user operations like registration and authentication.

**Good:**
> [NOT_FOUND: searched "UserService" in app/] No UserService class exists. User operations are handled directly in controllers.

### Mistake 2: Assuming from Names

**Bad:**
> The `calendar.retry_attempts` config controls how many times the API call retries.

**Good:**
> [VERIFIED: config/calendar.php:27] `retry_attempts` is defined but [NOT_FOUND: searched "retry_attempts" in app/Services/] not used in CalendarService. The config exists but is not wired up.

### Mistake 3: Stating Relationships Without Proof

**Bad:**
> When a booking is created, an email is sent to the user.

**Good:**
> [VERIFIED: app/Http/Controllers/BookingController.php:52] BookingCreated event is fired.
> [VERIFIED: app/Listeners/SyncToExternalCalendar.php:23] Listener syncs to calendar.
> [NOT_FOUND: searched "mail\|email\|notify" in app/] No email sending found in the booking flow.

---

## Checklist

Before considering documentation complete:

- [ ] Metadata section filled (commit, date, status)
- [ ] Every claim has a verification tag
- [ ] File:line citations verified by reading actual code
- [ ] NOT_FOUND used when searches return empty
- [ ] ASSUMED used (sparingly) with clear reasoning
- [ ] Verification summary counts are accurate
- [ ] Known issues section includes problems found
- [ ] Someone can checkout the commit and verify your claims
