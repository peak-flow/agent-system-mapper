# Whisper Architecture Overview

> ⚠️ **BAD EXAMPLE — DO NOT IMITATE.** This document demonstrates hallucination patterns specific to model-centric systems — above all, documenting a famous model from prior knowledge instead of from the repo. Each ❌ callout explains a failure. See good-architecture-doc-example.md for the correct approach.

## Metadata

| Field | Value |
|-------|-------|
| System | OpenAI Whisper |
| Documented | 2026-08-03 |
| Verification Status | Complete |

> **❌ PROBLEMS:** No repository, no path, no commit hash — nothing pins these
> claims to a checkable snapshot. "Complete" is not a verification status; the
> methodology requires `Verified` backed by a passing `verify.py` run. The good
> example pins Repository, Path, Upstream commit, and a verify command.

## 1. System Classification

| Field | Value |
|-------|-------|
| Type | State-of-the-art ASR foundation model |
| Evidence | Whisper is one of the most widely used speech models in the world |
| Confidence | HIGH |

> **❌ PROBLEMS:** Popularity is not evidence — the classification cites the
> model's reputation, not a single file. The real evidence is in the repo:
> `torch` in requirements.txt:3, `nn.Module` classes in whisper/model.py:252,
> and a checkpoint URL registry at whisper/__init__.py:17-32. `HIGH` is not a
> valid confidence tag, and the required Category / Overlay Loaded rows
> (Model-Centric, 01a overlay) are missing entirely.

## 2. Model Architecture

Whisper is a Transformer encoder–decoder trained on 680,000 hours of
multilingual and multitask supervised data collected from the web. The audio
encoder ingests 80-channel log-mel spectrograms through two convolutional
layers followed by a stack of Transformer blocks with pre-activation residual
connections; the text decoder uses learned positional embeddings and
cross-attends to the encoder output. The `large-v3` checkpoint has 32 encoder
and 32 decoder layers, a width of 1280, 20 attention heads, and roughly 1.55
billion parameters, while `turbo` prunes the decoder to 4 layers for an 8x
speedup at nearly identical accuracy. [VERIFIED]

On benchmarks, Whisper achieves a 2.7% word error rate on LibriSpeech
test-clean and approaches human-level robustness on out-of-distribution
audio, which is why no fine-tuning is usually necessary.

> **❌ PROBLEMS:** Every number here comes from the Whisper *paper*, not from
> this repository — the documenter "knows" Whisper from training data and wrote
> it down as if it were verified. Layer counts, widths, and parameter counts
> appear nowhere in the code: `ModelDimensions` is an empty schema filled from
> `checkpoint["dims"]` at load time (whisper/model.py:25-36,
> whisper/__init__.py:154). "680,000 hours" appears nowhere in this repo; the
> README mentions training only as prose pointing at the paper (README.md:8,
> README.md:15). The WER claim is nowhere in this repo either — README.md:76
> links WER figures *in the paper*. A bare `[VERIFIED]` with no file:line
> after a paragraph of paper facts is the signature failure mode for famous
> ML repos. Even "Transformer" is not stated in the model code — the good
> example marks the architecture type `[INFERRED]` from the attention-block
> classes (whisper/model.py:81, 142, 174, 207).

## 3. Model Weights

The pretrained weights for all model sizes ship in the repository under
`whisper/assets/`, so the package works offline out of the box. Loading a
model simply deserializes the bundled checkpoint:

```
load_model("turbo")
        ↓
read whisper/assets/turbo.pt
        ↓
model ready
```

> **❌ PROBLEMS:** False, and checkably so. No `.pt`, `.safetensors`, or
> `.onnx` file exists anywhere in this repo — `_MODELS` at
> whisper/__init__.py:17-32 is a table of **download URLs**, and
> whisper/__init__.py:136-137 fetches the checkpoint at runtime into
> `~/.cache/whisper` (whisper/__init__.py:132-134), verifying a SHA-256 from
> the URL path (whisper/__init__.py:57, 90-93). `whisper/assets/` holds the
> mel filterbank and tokenizer vocab — not weights (whisper/audio.py:105,
> whisper/tokenizer.py:332) — and in this vendored copy it is pruned anyway
> (VENDORED.md:13). The ASCII arrow diagram is also a banned form: Section 3
> must use tables.

## 4. Training Pipeline

Training uses AdamW with a linear learning-rate warmup over the first 2048
steps, gradient checkpointing, and BF16 mixed precision across 256 GPUs. The
dataset mixture is weighted toward English but includes 96 other languages,
with SpecAugment applied to the mel spectrograms. The training loop lives in
the repo and can be re-run to reproduce the released checkpoints, and
fine-tuning on custom data is supported through the same entry point.

> **❌ PROBLEMS:** None of this exists — not a single line. Searching the
> package for "train", "optimizer", "loss", and "backward" returns zero
> matches; the only gradient-related code *disables* gradients for inference
> (whisper/decoding.py:18, whisper/decoding.py:792, whisper/timing.py:196).
> There is no training loop, no fine-tuning entry point, no SpecAugment, no
> dataset code — nowhere in this repo. The optimizer, warmup schedule, GPU
> count, and mixed-precision details are speculation dressed as documentation.
> The correct treatment is a Boundaries section with recorded searches:
> `[NOT_FOUND: searched "train", "optimizer", "loss", "backward" in whisper/]`.

## 5. Decoding Internals

Transcription decodes each 30-second window as follows:

1. Start decoding at temperature 0.0 using beam search with 5 beams; each
   step expands every beam by the top-k next tokens and keeps the 5 highest
   cumulative log-probability sequences, with finished beams set aside once
   they emit end-of-text.
2. Compute the gzip compression ratio of the decoded text; if it exceeds 2.4
   the output is judged repetitive and the result is discarded.
3. Check the average log probability; if it is below -1.0 the decode is
   judged low-confidence and discarded.
4. On either failure, raise the temperature by 0.2 and switch from beam
   search to multinomial sampling with best-of-5 reranking, because sampling
   explores the distribution better than beams at high temperature.
5. Repeat up to temperature 1.0; if the no-speech probability exceeds 0.6 the
   window is skipped as silence.

## Boundaries

This system does NOT:

- Provide training pipelines [VERIFIED: no training code found]
- Support fine-tuning [VERIFIED/NOT_FOUND]
- Include evaluation scripts [VERIFIED/NOT_FOUND]

> **❌ PROBLEMS (Section 5):** This is step-by-step algorithm tracing at a
> depth the architecture overview bans outright — the overlay's rule is
> discovery only: name where decoding lives, defer the how to
> 02-code-flows.md. The fallback logic does exist (whisper/transcribe.py:184-224,
> defaults at whisper/transcribe.py:43) and the strategy choice exists
> (whisper/decoding.py:508-551, GreedyDecoder at whisper/decoding.py:272,
> BeamSearchDecoder at whisper/decoding.py:301), but not one of the five steps
> carries a citation, and step 4's "because sampling explores the distribution
> better" is an invented rationale that appears nowhere in the code.
>
> **❌ PROBLEMS (Boundaries):** The right facts wearing illegal tags.
> `[VERIFIED: no training code found]` abuses VERIFIED for an *absence* — a
> verifier can only resolve VERIFIED to a file and line, so absence claims
> must use `[NOT_FOUND: searched ...]` with the search terms recorded.
> `[VERIFIED/NOT_FOUND]` is not a tag at all — it is an unfilled template
> placeholder left in the doc. Correct forms:
> `[NOT_FOUND: searched "train", "optimizer", "loss", "backward" in whisper/]`,
> `[NOT_FOUND: searched "fine-tune", "finetune", "lora", "adapter" in whisper/]`.

## Why This Example is BAD

1. **False:** "Trained on 680,000 hours; 32 layers; 1.55B parameters; 2.7%
   WER." **Reality:** paper knowledge, nowhere in this repo. Dimensions come
   from the downloaded checkpoint at runtime (whisper/model.py:25-36,
   whisper/__init__.py:154); the README's training and WER mentions are prose
   pointing at the paper (README.md:8, README.md:76).
2. **False:** "Weights ship in the repository under whisper/assets/."
   **Reality:** weights are downloaded at runtime from a URL table
   (whisper/__init__.py:17-32, 136-137); `assets/` holds mel filters and
   tokenizer vocab (whisper/audio.py:105, whisper/tokenizer.py:332) and is
   pruned in this vendored copy (VENDORED.md:13).
3. **False:** "The training loop lives in the repo; fine-tuning is supported."
   **Reality:** zero matches for "train", "optimizer", "loss", "backward"
   anywhere in whisper/ — this is an inference-only codebase.
4. **Banned depth:** five-step beam-search and temperature-fallback trace with
   an invented rationale — architecture docs identify surfaces
   (whisper/transcribe.py:184-224) and defer internals to 02-code-flows.md.
5. **Illegal tags:** bare `[VERIFIED]` after paper facts,
   `[VERIFIED: no training code found]` for an absence, and the template
   placeholder `[VERIFIED/NOT_FOUND]` — none of these can be checked by
   `verify.py`; not one claim in the document carries a file:line citation.
6. **Headline lesson:** the model's fame is not evidence about this
   repository. The more famous the model, the more the documenter already
   "knows" — and the more ruthlessly every claim must be re-derived from the
   files actually present, with `[NOT_FOUND]` for everything (training, data,
   metrics, weights) that lives in the paper or the checkpoint instead of the
   code.
