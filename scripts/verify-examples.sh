#!/bin/bash
#
# CI guard: every good example must pass verify.py against its source root.
# This is what keeps the teaching examples from drifting away from the mini
# apps they cite — the exact failure mode the methodology exists to prevent.
#
# Run from the repo root:  bash scripts/verify-examples.sh

set -u
cd "$(dirname "$0")/.."

# doc|repo-root pairs (repo-root relative to repo root; "." = repo itself)
PAIRS=(
  "examples/verifier/good-architecture-doc-example.md|."
  "examples/laravel/good-architecture-doc-example.md|examples/laravel/slotbooker"
  "examples/laravel/good-code-flow-doc-example.md|examples/laravel/slotbooker"
  "examples/test-surface/good-test-surface-example.md|examples/laravel/slotbooker"
  "examples/fastapi/good-architecture-doc-example.md|examples/fastapi/tasktracker"
  "examples/livewire/good-architecture-doc-example.md|examples/livewire/approval-flow"
  "examples/react/good-architecture-doc-example.md|examples/react/expense-tracker"
  "examples/nextjs/good-architecture-doc-example.md|examples/nextjs/linkboard"
  "examples/vue/good-architecture-doc-example.md|examples/vue/kanban-board"
  "examples/packages/requests/good-architecture-doc-example.md|examples/packages/requests/source"
  "examples/model-systems/good-architecture-doc-example.md|examples/model-systems/whisper"
)

fails=0
for pair in "${PAIRS[@]}"; do
  doc="${pair%%|*}"
  root="${pair##*|}"
  if [ ! -f "$doc" ]; then
    echo "MISSING  $doc"
    fails=$((fails + 1))
    continue
  fi
  if python3 verify.py "$doc" --repo-root "$root" > /tmp/verify-example-out.txt 2>&1; then
    echo "PASS     $doc"
  else
    echo "FAIL     $doc  (root: $root)"
    tail -20 /tmp/verify-example-out.txt | sed 's/^/         /'
    fails=$((fails + 1))
  fi
done

echo ""
if [ "$fails" -gt 0 ]; then
  echo "verify-examples: $fails example(s) failed — fix the docs, not the verifier."
  exit 1
fi
echo "verify-examples: all good examples pass."
