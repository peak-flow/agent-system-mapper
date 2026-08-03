# Architecture Overview: Whisper (vendored slim copy)

> **This is the canonical model-centric (ML/AI) example for the agent-system-mapper methodology.**
>
> It documents the vendored slim copy of `openai/whisper` under
> `examples/model-systems/whisper/` and demonstrates the
> `01a-overlay-model-systems.md` overlay applied on top of the standard
> `01-architecture-overview.md` format. Every citation resolves against the
> vendored source, so the doc is machine-verifiable. Pay particular attention
> to how it handles what is NOT here: model weights (downloaded at runtime),
> training code (never existed in this repo), and the pruned `whisper/assets/`
> directory.

## Metadata

| Field | Value |
|-------|-------|
| Repository | `agent-system-mapper` |
| Path | `examples/model-systems/whisper/` |
| Upstream | `openai/whisper, commit c0d2f62` |
| Commit | `213c7d4` |
| Documented | `2026-08-03` |
| Verification Status | `Verified` |

**Verify with:**

```bash
python3 verify.py examples/model-systems/good-architecture-doc-example.md --repo-root examples/model-systems/whisper
```

## Verification Summary

- VERIFIED: 100 tags — 160 `file:line` citations, all resolved (0 informal)
- INFERRED: 1 tag
- NOT_FOUND: 13 tags (each records the searches performed)
- ASSUMED: 0 tags
- NEEDS_VERIFICATION: 1 tag
- Quoted code blocks: 3/3 exact copies of the cited lines

## Example Reference

| Field | Value |
|-------|-------|
| Methodology | `prompts/01-architecture-overview.md` + `prompts/01a-overlay-model-systems.md` (overlay) |
| Key Format Elements | Section 3 as tables (no arrows, no traces); Model Asset Inventory separating weights from code; `[NOT_FOUND]` with recorded searches for training code; overlay's discovery-only rule (no attention math, no sampling internals) |

---

## 0. System Classification

| Field | Value |
|-------|-------|
| Category | Model-Centric (ML/AI) |
| Type | Inference library + CLI for a pretrained speech-recognition model |
| Evidence | `torch` dependency [VERIFIED: requirements.txt:3]; `nn.Module` model classes [VERIFIED: whisper/model.py:252]; registry of pretrained checkpoint URLs [VERIFIED: whisper/__init__.py:17-32] |
| Overlay Loaded | Yes: `01a-overlay-model-systems.md` |
| Confidence | `[VERIFIED]` |

### Model System Classification (Overlay Step 0)

| Field | Value |
|-------|-------|
| Model Type | Inference-only |
| Has Training Code | No — [NOT_FOUND: searched "train", "optimizer", "loss", "backward" in whisper/ — zero matches; README.md:8 and README.md:15 mention training only as prose about the upstream project] |
| Has Inference Code | Yes [VERIFIED: whisper/decoding.py:792-798, whisper/transcribe.py:38-56] |
| Weight Format | `.pt` (PyTorch checkpoints, loaded with `torch.load`) [VERIFIED: whisper/__init__.py:18, whisper/__init__.py:151] |
| Weight Source | Downloaded at runtime from `openaipublic.azureedge.net`; NOT shipped in the repo [VERIFIED: whisper/__init__.py:17-32] [NOT_FOUND: searched for *.pt, *.safetensors, *.onnx, *.bin files under examples/model-systems/whisper/ — none present] |

---

## 1. System Purpose

Whisper is a speech-recognition package: it loads a pretrained encoder–decoder
checkpoint and turns audio files into transcribed (or English-translated) text,
with optional word-level timestamps and subtitle-format output. This vendored
copy contains the Python source only — the package code defines the model
*architecture* and the *inference pipeline*, while the model *behavior* lives in
weights that are downloaded on first use into `~/.cache/whisper`
[VERIFIED: whisper/__init__.py:132-137]. The upstream README describes the approach and
links the paper [VERIFIED: README.md:8], but nothing about training exists in
this codebase (see Section 12, Boundaries).

Note on this snapshot: `whisper/assets/` (mel filterbank + tokenizer vocab
data) and `whisper/normalizers/english.json` were pruned when vendoring
[VERIFIED: VENDORED.md:13], so this copy documents structure faithfully but is
not runnable as-is (see Section 6).

---

## 2. Component Map

| Component | Location | Responsibility | Evidence |
|-----------|----------|----------------|----------|
| Package API + weight download | `whisper/__init__.py` | `_MODELS` URL registry, `_download` with SHA-256 check, `available_models`, `load_model` | [VERIFIED: whisper/__init__.py:17-32, 54-95, 98-100, 103-161] |
| CLI shim | `whisper/__main__.py` | `python -m whisper` delegates to `transcribe.cli` | [VERIFIED: whisper/__main__.py:1-3] |
| Audio front-end | `whisper/audio.py` | ffmpeg-based loading, pad/trim, mel filterbank, log-mel spectrogram | [VERIFIED: whisper/audio.py:25-62, 65-88, 91-107, 110-157] |
| Model definition | `whisper/model.py` | `ModelDimensions`, `AudioEncoder`, `TextDecoder`, `Whisper` module; binds `transcribe`/`decode`/`detect_language` as methods | [VERIFIED: whisper/model.py:25-36, 174, 207, 252, 343-345] |
| Decoding surface | `whisper/decoding.py` | `DecodingOptions`/`DecodingResult` dataclasses, `DecodingTask`, `decode`, `detect_language` | [VERIFIED: whisper/decoding.py:80-114, 117-127, 508, 792-798, 18-21] |
| Transcription orchestrator + CLI | `whisper/transcribe.py` | `transcribe` (windowed inference over long audio), `cli` (argparse surface) | [VERIFIED: whisper/transcribe.py:38-56, 517-528] |
| Word-timing | `whisper/timing.py` | DTW alignment for word-level timestamps (`add_word_timestamps`) | [VERIFIED: whisper/timing.py:141-151, 279] |
| CUDA kernels | `whisper/triton_ops.py` | Triton DTW/median kernels, imported lazily from `timing.dtw_cuda` | [VERIFIED: whisper/triton_ops.py:13-14, whisper/timing.py:109] |
| Tokenizer | `whisper/tokenizer.py` | `Tokenizer` wrapper over tiktoken encodings; special control tokens | [VERIFIED: whisper/tokenizer.py:131-132, 330-363, 366-395] |
| Output writers | `whisper/utils.py` | `ResultWriter` family (txt/vtt/srt/tsv/json), `get_writer` | [VERIFIED: whisper/utils.py:85, 109, 238, 251, 265, 287, 296-318] |
| Text normalizers | `whisper/normalizers/` | Basic + English text normalization | [VERIFIED: whisper/normalizers/__init__.py:1-2] |
| Version | `whisper/version.py` | Single `__version__` string | [VERIFIED: whisper/version.py:1] |

---

## 3. Execution Surfaces & High-Level Data Movement (Discovery Only)

### 3.1 Primary Execution Surfaces

| Entry Surface | Type | Pipeline Stage | Primary Components Involved | Evidence |
|---------------|------|----------------|-----------------------------|----------|
| `python -m whisper AUDIO...` | CLI | Full pipeline | `__main__` → `transcribe.cli` → `load_model` → `transcribe` → writers | [VERIFIED: whisper/__main__.py:1-3, whisper/transcribe.py:517] |
| `whisper AUDIO...` (console script) | CLI | Full pipeline | packaging entry point `whisper.transcribe:cli` | [VERIFIED: pyproject.toml:35] |
| `whisper.load_model(name)` | Library API | Weight acquisition + model construction | `_download`, `ModelDimensions`, `Whisper` | [VERIFIED: whisper/__init__.py:103-161] |
| `model.transcribe(audio)` | Library API | Full pipeline (long audio, windowed) | `log_mel_spectrogram`, `decode`, `Tokenizer`, `add_word_timestamps` | [VERIFIED: whisper/transcribe.py:38-56, whisper/model.py:344] |
| `whisper.decode(model, mel, options)` | Library API | Single 30-second segment | `DecodingTask`, `TextDecoder` | [VERIFIED: whisper/decoding.py:792-798] |
| `whisper.detect_language(model, mel)` | Library API | Language ID only | encoder + single-token decoder pass | [VERIFIED: whisper/decoding.py:18-21] |

The console script is the only installed executable, declared in one line
[VERIFIED: pyproject.toml:35]:

```toml
scripts.whisper = "whisper.transcribe:cli"
```

The package re-exports the library surface (`load_audio`,
`log_mel_spectrogram`, `pad_or_trim`, `decode`, `detect_language`,
`load_model`, `transcribe`) from the top of the package
[VERIFIED: whisper/__init__.py:11-15].

[NOT_FOUND: searched "flask", "fastapi", "gradio", "streamlit", "socket" in whisper/ — no web demo or HTTP serving surface exists]

### 3.2 High-Level Data Movement (Non-Procedural)

What moves, not how it moves. Stage internals (windowing, fallback, search
strategies) are deliberately not described here — see `02-code-flows.md`.

| Stage | Input | Output | Component | Evidence |
|-------|-------|--------|-----------|----------|
| Weight acquisition | Model name | Verified `.pt` checkpoint file (cached) | `_download` | [VERIFIED: whisper/__init__.py:54-95] |
| Model construction | Checkpoint file | `Whisper` module on device | `load_model`, `ModelDimensions` | [VERIFIED: whisper/__init__.py:147-161] |
| Audio decode | Audio file path | float32 mono waveform @ 16 kHz | `load_audio` (ffmpeg subprocess) | [VERIFIED: whisper/audio.py:25-62] |
| Feature extraction | Waveform | Log-mel spectrogram tensor | `log_mel_spectrogram`, `mel_filters` | [VERIFIED: whisper/audio.py:91-107, 110-157] |
| Encoding | Mel segment | Audio feature tensor | `AudioEncoder` (inside `Whisper`) | [VERIFIED: whisper/model.py:174-204] |
| Decoding | Audio features + prompt tokens | Token ids + per-segment metrics | `decode` / `DecodingTask`, `TextDecoder` | [VERIFIED: whisper/decoding.py:792-826, whisper/model.py:207-249] |
| Text assembly | Token ids across windows | `{text, segments, language}` dict | `transcribe`, `Tokenizer.decode` | [VERIFIED: whisper/transcribe.py:510-514] |
| Output writing | Result dict | `.txt`/`.vtt`/`.srt`/`.tsv`/`.json` files | `get_writer` + `ResultWriter` subclasses | [VERIFIED: whisper/utils.py:296-318] |

### 3.3 Pointers to Code Flow Documentation

Candidates for detailed flow tracing (see `02-code-flows.md`):

- **CLI transcription end-to-end** — argument parsing through writer output [VERIFIED: whisper/transcribe.py:517, whisper/transcribe.py:613-619]
- **Weight download & cache validation** — cache hit, checksum mismatch, re-download [VERIFIED: whisper/__init__.py:54-95]
- **Windowed transcription with fallback** — the per-segment decode strategy exists at whisper/transcribe.py:184-224 but its internals belong in the flow doc, not here
- **Word-timestamp alignment** — DTW with CUDA/CPU selection [VERIFIED: whisper/timing.py:141-151]

### Section 3 Self-Check

- [x] No method bodies longer than 3 lines quoted
- [x] No loops or conditionals described
- [x] No sampling, search, or attention algorithms explained
- [x] All movements as conceptual stages in tables
- [x] Defers to `02-code-flows.md`

---

## 3b. Frontend → Backend Interaction Map

Not applicable — this system is a CLI tool and Python library. The only user
surfaces are the terminal and the importable API (Section 3.1). [NOT_FOUND:
searched "html", "template", "fetch(", "ajax" in whisper/ — no frontend]

---

## 4. File/Folder Conventions

| Pattern | Meaning | Evidence |
|---------|---------|----------|
| `whisper/` flat module layout | One module per pipeline concern (audio, model, decoding, transcribe, timing, tokenizer, utils) | [VERIFIED: whisper/version.py:1 and the ten sibling modules listed in Section 2] |
| `whisper/normalizers/` | Only subpackage; text normalization for downstream comparison of transcripts | [VERIFIED: whisper/normalizers/__init__.py:1-2] |
| `whisper/assets/` | Expected data directory for mel filterbank + tokenizer vocab; referenced by code but pruned from this vendored copy | [VERIFIED: whisper/audio.py:105, whisper/tokenizer.py:332] and [VERIFIED: VENDORED.md:13] |
| Late imports to break cycles | `model.py` imports `decode`/`transcribe`/`detect_language` functions and binds them as `Whisper` methods | [VERIFIED: whisper/model.py:12-14, whisper/model.py:343-345] |
| `TYPE_CHECKING` guards | Modules type-hint `Whisper` without importing it at runtime | [VERIFIED: whisper/transcribe.py:34-35, whisper/decoding.py:14-15, whisper/timing.py:15-16] |

---

## 5. External Dependencies

| Dependency | Purpose | Evidence |
|------------|---------|----------|
| `torch` | Model definition, tensor ops, checkpoint loading | [VERIFIED: whisper/model.py:8-10, whisper/__init__.py:151, requirements.txt:3] |
| `tiktoken` | BPE encodings backing the `Tokenizer` | [VERIFIED: whisper/tokenizer.py:8, whisper/tokenizer.py:357-363] |
| `numpy` | Array handling across audio/decoding | [VERIFIED: whisper/audio.py:6, whisper/decoding.py:4] |
| `numba` | JIT-compiled CPU DTW for word timing | [VERIFIED: whisper/timing.py:57-58, 82-83] |
| `triton` (Linux x86_64 only) | CUDA DTW/median kernels | [VERIFIED: whisper/triton_ops.py:6-10, requirements.txt:7] |
| `tqdm` | Download and transcription progress bars | [VERIFIED: whisper/__init__.py:9, whisper/transcribe.py:264-266] |
| `more-itertools` | `windowed()` in the English normalizer | [VERIFIED: whisper/normalizers/english.py:7] |
| `ffmpeg` (system binary, not a Python package) | Audio decode/resample via subprocess; must be on `PATH` | [VERIFIED: whisper/audio.py:42-58] |
| `openaipublic.azureedge.net` (network service) | Hosts the pretrained checkpoints fetched at runtime | [VERIFIED: whisper/__init__.py:17-32, whisper/__init__.py:73] |

---

## 6. Known Issues & Risks

| Risk | Location | Notes |
|------|----------|-------|
| This vendored snapshot cannot run inference | `whisper/audio.py:105`, `whisper/tokenizer.py:332` | Both load files from `whisper/assets/`, which was pruned when vendoring [VERIFIED: VENDORED.md:13]. Documenting this honestly beats pretending the assets exist. |
| English normalizer data pruned | `whisper/normalizers/english.py:458` | `EnglishSpellingNormalizer` opens `english.json` next to the module; also pruned [VERIFIED: VENDORED.md:13] |
| Checkpoint download has no retry/resume | `whisper/__init__.py:90-93` | A SHA-256 mismatch after download raises and asks the user to retry manually |
| Control flow admitted to be obscure | `whisper/transcribe.py:268-271` | An in-code NOTE says the main loop "is obscurely flattened to make the diff readable" and should be simplified later |
| Import-time failure mode for CUDA timing | `whisper/triton_ops.py:6-10` | Raises `RuntimeError` if `triton` is missing; mitigated by lazy import + CPU fallback [VERIFIED: whisper/timing.py:109, whisper/timing.py:141-151] |
| Typo in user-facing warning | `whisper/transcribe.py:577-582` | Warning text says "receipted" where "received" is meant |

---

## 7. Entry Points Summary

| Entry Type | Count | Locations |
|------------|-------|-----------|
| CLI scripts | 2 | `python -m whisper` [VERIFIED: whisper/__main__.py:1-3]; `whisper` console script [VERIFIED: pyproject.toml:35] |
| Public library functions | 8 re-exported names | `load_audio`, `log_mel_spectrogram`, `pad_or_trim`, `decode`, `detect_language`, `load_model`, `transcribe`, `available_models` [VERIFIED: whisper/__init__.py:11-15, 98-100, 103] |
| HTTP routes | 0 | [NOT_FOUND: no server code; the only network use is outbound checkpoint download at whisper/__init__.py:73] |
| Out-of-process commands | 1 | `ffmpeg` subprocess for audio decoding [VERIFIED: whisper/audio.py:45-58] |
| Event listeners / webhooks | 0 | [NOT_FOUND: searched "listen", "webhook", "callback registration" in whisper/] |

---

## 8. Technology Stack Summary

| Layer | Technology | Evidence |
|-------|------------|----------|
| Language | Python >= 3.8 | [VERIFIED: pyproject.toml:13] |
| ML framework | PyTorch (`torch`) | [VERIFIED: requirements.txt:3, whisper/model.py:8-10] |
| Tokenization | tiktoken (BPE) | [VERIFIED: whisper/tokenizer.py:8] |
| Acceleration | numba (CPU JIT), triton (CUDA kernels) | [VERIFIED: whisper/timing.py:57, whisper/triton_ops.py:13-14] |
| Audio I/O | ffmpeg via subprocess | [VERIFIED: whisper/audio.py:42-58] |
| Packaging | setuptools via `pyproject.toml`; console script entry | [VERIFIED: pyproject.toml:2, pyproject.toml:35] |
| License | MIT (code and upstream model weights) | [VERIFIED: pyproject.toml:11, README.md:160] |
| External services | Azure CDN for checkpoint hosting (runtime only) | [VERIFIED: whisper/__init__.py:17-32] |

---

## 9. Model Asset Inventory (Overlay)

The single most important distinction in a model-centric system: **what ships
as code in this repo vs. what arrives as data at runtime**.

| Asset | In this repo? | Runtime source | Evidence |
|-------|---------------|----------------|----------|
| Model weights (`{name}.pt`) | **No** | Downloaded on first `load_model` into `$XDG_CACHE_HOME/whisper` (default `~/.cache/whisper`) from the `_MODELS` URL table | [VERIFIED: whisper/__init__.py:17-32, whisper/__init__.py:132-137] [NOT_FOUND: searched for *.pt, *.safetensors, *.onnx, *.bin under examples/model-systems/whisper/ — none present; upstream does not ship them either, per VENDORED.md:15-16] |
| Weight integrity check | n/a (code only) | Expected SHA-256 is the second-to-last URL path segment; verified on cache hit and after download | [VERIFIED: whisper/__init__.py:57, whisper/__init__.py:63-71, whisper/__init__.py:90-93] |
| Mel filterbank (`assets/mel_filters.npz`) | **No — pruned in this vendored copy** | Code expects it inside the package | [VERIFIED: whisper/audio.py:105] code path; [VERIFIED: VENDORED.md:13] pruning |
| Tokenizer vocab (`assets/gpt2.tiktoken`, `assets/multilingual.tiktoken`) | **No — pruned in this vendored copy** | Code expects it inside the package | [VERIFIED: whisper/tokenizer.py:332]; [VERIFIED: VENDORED.md:13] |
| English spelling map (`normalizers/english.json`) | **No — pruned in this vendored copy** | Code expects it next to the module | [VERIFIED: whisper/normalizers/english.py:458]; [VERIFIED: VENDORED.md:13] |
| Cross-attention alignment heads | **Yes** — inline base85-encoded blobs in source | Decoded at load time for word timing | [VERIFIED: whisper/__init__.py:36-51, whisper/model.py:278-285] |

The weight download is two lines of dispatch, cited exactly
[VERIFIED: whisper/__init__.py:136-137]:

```python
    if name in _MODELS:
        checkpoint_file = _download(_MODELS[name], download_root, in_memory)
```

And the pruned-asset dependency is a single load path
[VERIFIED: whisper/audio.py:105]:

```python
    filters_path = os.path.join(os.path.dirname(__file__), "assets", "mel_filters.npz")
```

---

## 10. Model Architecture (Verified Only) (Overlay)

Only what the code states. Layer counts, parameter counts, and training details
live in the downloaded checkpoint and the upstream paper — not in this repo.

| Field | Value | Evidence |
|-------|-------|----------|
| Model Class | `Whisper(nn.Module)` composed of `AudioEncoder` + `TextDecoder` | [VERIFIED: whisper/model.py:252-269] |
| Dimensions schema | `ModelDimensions` — 10 integers (mels, ctx sizes, widths, heads, layers, vocab) populated from `checkpoint["dims"]` at load time | [VERIFIED: whisper/model.py:25-36, whisper/__init__.py:154] |
| Parameter Count | [NOT_FOUND: not stated anywhere in the code; determined by the downloaded checkpoint] | — |
| Layer counts / widths per model size | [NOT_FOUND: not hard-coded; `load_model` reads them from the checkpoint. The code names model sizes only as download keys — whisper/__init__.py:17-32] | — |
| Architecture Type | Encoder–decoder built from residual attention blocks | [INFERRED: `AudioEncoder` and `TextDecoder` are stacks of `ResidualAttentionBlock` containing `MultiHeadAttention` — whisper/model.py:81, 142, 174, 207. The README's "Transformer sequence-to-sequence model" phrasing (README.md:15) is upstream prose, not code evidence] |
| Multilingual detection | Derived from vocab size at runtime (`n_vocab >= 51865`) | [VERIFIED: whisper/model.py:302-308] |
| Weight File(s) | `tiny`/`base`/`small`/`medium`/`large-v1..v3`/`turbo` variants as `{name}.pt` | [VERIFIED: whisper/__init__.py:17-32] |
| Weight Source | `https://openaipublic.azureedge.net/main/whisper/models/...` | [VERIFIED: whisper/__init__.py:18] |
| Training data | [NOT_FOUND: no dataset handling, no data loaders, no references in whisper/; the famous "680,000 hours" figure is from the upstream paper and appears nowhere in this repo] | — |
| Evaluation / benchmarks | [NOT_FOUND: searched "evaluate", "benchmark", "dataset", "wer" in whisper/ — zero matches; README.md:76 links WER figures in the paper, which is prose, not repo evidence] | — |

---

## 11. Configuration & Control Surface (Overlay)

| Config | Location | Controls | Evidence |
|--------|----------|----------|----------|
| CLI flags (~30) | `whisper/transcribe.py` | model choice, task, language, temperature schedule, thresholds, word timestamps, output format/dir, threads | [VERIFIED: whisper/transcribe.py:528-567] |
| `DecodingOptions` dataclass | `whisper/decoding.py` | per-segment decoding controls (task, language, temperature, beam/best-of sizes, prompts, token suppression, timestamp rules, fp16) | [VERIFIED: whisper/decoding.py:80-114] |
| `transcribe()` keyword args | `whisper/transcribe.py` | temperature tuple with fallback thresholds, prompt carrying, clip timestamps, hallucination-silence threshold | [VERIFIED: whisper/transcribe.py:38-56] |
| `XDG_CACHE_HOME` env var | `whisper/__init__.py` | Overrides the weight cache directory | [VERIFIED: whisper/__init__.py:132-134] |
| Audio constants | `whisper/audio.py` | 16 kHz sample rate, 30-second chunks, hop/frame geometry — every downstream tensor shape depends on these | [VERIFIED: whisper/audio.py:12-22] |
| Special control tokens | `whisper/tokenizer.py` | Task/language/timestamp control codes appended to the vocabulary in a fixed order | [VERIFIED: whisper/tokenizer.py:340-355] |

---

## 12. Boundaries & Non-Responsibilities (Overlay)

This system does NOT:

- Train models — [NOT_FOUND: searched "train", "optimizer", "loss", "backward" in whisper/ — zero matches. The only gradient-related code *disables* gradients for inference: whisper/decoding.py:18, whisper/decoding.py:792, whisper/timing.py:196]
- Fine-tune or adapt weights — [NOT_FOUND: searched "fine-tune", "finetune", "lora", "adapter", "save_pretrained" in whisper/ — zero matches]
- Evaluate or benchmark — [NOT_FOUND: searched "evaluate", "benchmark", "dataset" in whisper/ — zero matches; tests were also pruned from this vendored copy per VENDORED.md:13]
- Ship model weights or serve them — weights are fetched from a CDN at runtime [VERIFIED: whisper/__init__.py:73]
- Record or stream audio — input is a file path or an in-memory array only [VERIFIED: whisper/transcribe.py:40, whisper/audio.py:25]

Out of scope by design: speaker diarization, real-time/streaming transcription,
model quantization, and serving infrastructure — none of these appear anywhere
in the source.
[NEEDS_VERIFICATION: whether the upstream tests (pruned from this snapshot) exercise any additional surface cannot be checked from this copy]

---

## 13. Risk & Change Surface (Overlay)

| File/Component | Risk Level | Why |
|----------------|------------|-----|
| `_MODELS` URL/checksum registry | Critical | Every checkpoint fetch depends on these URLs and their embedded SHA-256 path segments; a stale entry bricks `load_model` [VERIFIED: whisper/__init__.py:17-32, whisper/__init__.py:57] |
| `whisper/assets/` contents (absent here) | Critical | Tokenizer vocab and mel filterbank; inference cannot start without them [VERIFIED: whisper/audio.py:105, whisper/tokenizer.py:332] |
| Special-token list order | Critical | Token ids are assigned by position in the `specials` list; reordering silently changes every control token id [VERIFIED: whisper/tokenizer.py:340-355] |
| Audio geometry constants | High | `SAMPLE_RATE`, `N_FFT`, `HOP_LENGTH`, `CHUNK_LENGTH` fix all tensor shapes and timing math [VERIFIED: whisper/audio.py:12-22] |
| `ModelDimensions` field names | High | Must match `checkpoint["dims"]` keys exactly for every published checkpoint [VERIFIED: whisper/model.py:25-36, whisper/__init__.py:154] |
| Output writer formats | Medium | Five subtitle/data formats consumed by external tooling [VERIFIED: whisper/utils.py:296-318] |

---

## Why This Example is GOOD

1. **Fame is not evidence.** Whisper is one of the best-known models in the
   world, and that is exactly why this doc cites `whisper/__init__.py:17-32`
   for what the repo *does* contain and marks training data, parameter counts,
   and WER numbers as `[NOT_FOUND]` — those facts live in the paper and the
   checkpoint, not in this repository. A doc for an obscure repo and a doc for
   a famous repo must be held to the identical evidence standard.
2. **Assets are not code.** The Model Asset Inventory (Section 9) separates
   three different kinds of "not in the repo": weights that are downloaded at
   runtime (true upstream behavior, cited to the download code), data files
   pruned only from this vendored copy (cited to `VENDORED.md:13` instead of
   pretending they exist), and inline data that genuinely lives in source
   (`_ALIGNMENT_HEADS`). Each gets its own evidence trail.
3. **Absence is searched, not assumed.** Every "does not exist" claim records
   the exact search terms used (`train`, `optimizer`, `loss`, `backward`,
   `lora`, `evaluate`, ...), so a reader can re-run them.
4. **Discovery-only depth.** Section 3 names the temperature-fallback and
   beam-search *locations* without explaining a single step of how they work —
   no sampling algorithms, no attention math, no arrow diagrams. That depth is
   deferred to `02-code-flows.md`, per the overlay's non-procedural rule.
5. **Inference-only classification is explicit.** The overlay's Step 0 table
   states up front that this is an inference-only system with runtime-fetched
   `.pt` weights, so no reader can come away believing the repo trains,
   fine-tunes, or evaluates anything.
6. **Machine-verifiable.** Every `[VERIFIED: file:line]` tag resolves against
   `examples/model-systems/whisper/`, and the three quoted blocks are exact
   copies of their cited lines — `verify.py` exits 0 on this document.
