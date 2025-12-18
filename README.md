# agent-system-mapper

A reference skill and training environment for teaching AI agents (and humans) how to construct verified, actionable mental models of software systems.

**This repository is not a production application.**

It exists to demonstrate how to map an unfamiliar codebase into agent-readable knowledge that supports safe modification, onboarding, and long-term system memory.

---

## What this repo teaches

- How to identify entry points, execution paths, and system boundaries
- How to trace code flows without hallucination
- How to surface invariants, risks, and change constraints
- How to separate what the system *does* from *why* it is the way it is
- How to produce documentation that both humans and AI agents can act on

---

## What this repo is NOT

- Not a framework
- Not a best-practices example
- Not a clean-architecture showcase
- Not intended for direct reuse in production

---

## Why it exists

Most documentation explains how code works.

Very little explains how to understand a system well enough to change it safely — especially with AI agents in the loop.

This repository exists to close that gap.

---

## Repository Structure

```
agent-system-mapper/
├── slotbooker/              # Micro reference app (intentionally imperfect)
│   ├── app/
│   │   ├── Models/          # User, Booking, TimeSlot
│   │   ├── Contracts/       # Service interfaces
│   │   ├── Services/        # Business logic
│   │   ├── Http/Controllers/
│   │   ├── Events/
│   │   ├── Listeners/
│   │   └── Providers/
│   ├── routes/
│   ├── resources/views/
│   ├── public/js/
│   └── config/
├── guides/                  # Documentation methodology guides
│   └── 01-architecture-overview.md
└── examples/                # Good vs bad documentation examples
    ├── good-architecture-overview.md
    └── bad-architecture-overview.md
```

---

## Getting Started

1. Read the guides in `guides/` to understand the methodology
2. Examine `slotbooker/` as a reference implementation
3. Review `examples/` to see good vs bad documentation outputs
4. Apply the methodology to your own codebase
