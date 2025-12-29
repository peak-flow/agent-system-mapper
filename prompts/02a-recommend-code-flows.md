# Prompt: Recommend Code Flows

You are a documentation strategist. Your task is to analyze an architecture overview and recommend which code flows would be most valuable to document.

---

## Prerequisites

Before using this prompt, ensure you have:
1. A completed `01-architecture-overview.md` for the codebase
2. Read that architecture overview

---

## Step 0: Read the Architecture Overview (MANDATORY)

First, read the architecture overview document for this codebase:

```
Read: pf-docs/01-architecture-overview.md (or wherever it's located)
```

Extract and note:
- System classification (library, web app, CLI, etc.)
- Component map (what are the major pieces?)
- Execution surfaces (entry points)
- Data movement stages
- Any flows already suggested in Section 3.3

---

## Step 1: Identify Flow Candidates

For each execution surface in the architecture, ask:

| Question | If Yes → Candidate Flow |
|----------|------------------------|
| Is this the primary way users interact with the system? | **High priority** |
| Does this involve multiple components communicating? | Document the chain |
| Is this process opaque or "magical" to users? | High value to demystify |
| Do errors here cause confusion? | Document for debugging |
| Does this have async/background processing? | Document sync vs async boundary |

### Flow Candidate Template

For each candidate, note:

```markdown
### Flow: [Name]
- **Trigger**: What starts this flow?
- **Components involved**: Which parts of the system?
- **Complexity**: Low / Medium / High
- **User value**: Why would someone want to understand this?
- **Key files to trace**: List starting points
```

---

## Step 2: Prioritize Flows

Score each candidate:

| Criterion | Score |
|-----------|-------|
| **Frequency**: How often do users encounter this? | 1-3 |
| **Complexity**: How many components involved? | 1-3 |
| **Mystery**: How "magical" or opaque is it? | 1-3 |
| **Debug value**: Does understanding help troubleshooting? | 1-3 |

**Priority = Sum of scores**
- 10-12: High priority (document first)
- 7-9: Medium priority
- 4-6: Low priority (skip unless requested)

---

## Step 3: Generate Recommendations

Output a recommendations document with this structure:

```markdown
# Code Flow Recommendations: [Library/Project Name]

> Generated: [Date]
> Based on: [Architecture overview location]

## Summary

| Flow | Priority | Components | Effort |
|------|----------|------------|--------|
| [Name] | High/Medium/Low | [Count] | Low/Medium/High |

---

## Recommended Flows

### 1. [Flow Name] (Priority: High)

**Why document this?**
[1-2 sentences on user value]

**Trigger**: [What starts this flow]

**Key components**:
- [Component 1] - [role]
- [Component 2] - [role]

**Key files to start tracing**:
- `path/to/file.ext` - [why start here]
- `path/to/other.ext` - [continues to]

**Prompt to use**:
```
Create code flow documentation for [project] covering:
[Flow name] - [brief description]

Reference the architecture overview at [path]
Start tracing from [file:function]
```

---

### 2. [Next Flow]
...

---

## Skip These (Low Value)

| Flow | Why Skip |
|------|----------|
| [Name] | [Reason - too simple, well-documented, niche, etc.] |

---

## Notes

[Any caveats, dependencies between flows, suggested order]
```

---

## Step 4: Validate Recommendations

Before finalizing, verify:

- [ ] Each recommended flow has specific files to start tracing
- [ ] Priorities are justified (not just gut feeling)
- [ ] "Skip" section explains why low-value flows are skipped
- [ ] Prompts are ready to use (copy-paste ready)

---

## Output Format

Save the recommendations to:
```
pf-docs/CODE-FLOW-RECOMMENDATIONS.md
```

Or if documenting a specific area:
```
pf-docs/CODE-FLOW-RECOMMENDATIONS-[area].md
```

---

## Examples of High-Value Flows by System Type

### Libraries/Packages
| Pattern | Example Flow |
|---------|--------------|
| Main API usage | `client.request()` → response |
| Object creation | `createMock()` → usable mock |
| Configuration | Config load → runtime behavior |
| Plugin/extension | Plugin registration → execution |

### Web Applications
| Pattern | Example Flow |
|---------|--------------|
| Request lifecycle | HTTP request → response |
| Authentication | Login → session → protected route |
| Background jobs | Queue dispatch → worker execution |
| Real-time | WebSocket message → broadcast |

### CLI Tools
| Pattern | Example Flow |
|---------|--------------|
| Command execution | `cli command` → output |
| Interactive mode | Prompt → input → action |
| Config resolution | Flags + file + env → final config |

### Test Frameworks
| Pattern | Example Flow |
|---------|--------------|
| Test execution | Test discovery → run → report |
| Assertion | `expect(x).toBe(y)` → pass/fail |
| Setup/teardown | Lifecycle hooks execution |
| Mocking | Mock creation → method interception |

---

## Anti-Patterns to Avoid

| Don't | Do Instead |
|-------|------------|
| Recommend every possible flow | Focus on 2-4 high-value flows |
| Guess at file locations | Verify files exist in architecture doc |
| Assume complexity from names | Check component map for actual complexity |
| Recommend flows with no clear start | Each flow needs a concrete trigger |

---

## Example Usage

**Input**: Architecture overview shows a PHP testing framework with TestCase, Assert, MockObject, Event System components.

**Output**:
```markdown
## Recommended Flows

### 1. Test Execution Lifecycle (Priority: High)

**Why document this?**
Most common question: "what happens when I run a test?"

**Trigger**: `phpunit` CLI invocation

**Key components**:
- Application - CLI entry point
- TestRunner - orchestration
- TestCase - setUp/runTest/tearDown
- Event System - lifecycle hooks

**Key files to start tracing**:
- `src/TextUI/Application.php:105` - CLI entry
- `src/Framework/TestCase.php` - runBare(), runTest()

**Prompt to use**:
```
Create code flow documentation for PHPUnit covering:
Test execution lifecycle - from phpunit CLI through setUp/runTest/tearDown

Start tracing from src/TextUI/Application.php:105
```
```
