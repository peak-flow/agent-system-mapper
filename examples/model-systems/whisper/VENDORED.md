# Vendored source: openai/whisper (slim)

Slim, pinned copy of Whisper's Python source so the model-systems
good/bad architecture examples have resolvable citations. This is the
reference target for the `01a-overlay-model-systems.md` overlay.

| Field | Value |
|-------|-------|
| Upstream | https://github.com/openai/whisper |
| Upstream commit | c0d2f62 |
| Vendored | 2026-08-03 |
| Contents | `whisper/*.py`, `whisper/normalizers/*.py`, README, packaging manifests, LICENSE |
| Pruned | `whisper/assets/` (mel filter + tokenizer binaries), `whisper/normalizers/english.json`, tests, notebooks, model weights |

Model weights are NOT in the upstream repo either — they download at
runtime. Documentation of this system must reflect that (see the good
example's Model Asset Inventory).

Do not edit these files — refresh by re-copying from upstream and
re-running the verifier on the example docs.
