# Overlay: Model-Centric Systems (ML/AI)

**Load this overlay when:** System contains neural network weights, inference pipelines, or ML frameworks.

This overlay adds rules **in addition to** the base `01-architecture-overview.md` rules.
All base anti-hallucination rules still apply.

---

## Why Model Systems Need Special Rules

| Traditional Code | Model-Centric System |
|------------------|----------------------|
| Entry points are functions/CLIs | Entry points are **pipelines + configs** |
| Logic is imperative | Logic is **dataflow + inference** |
| Behavior is code-driven | Behavior is **weights + architecture + runtime flags** |
| "What happens?" is readable | "What happens?" is **emergent from weights** |

Agents commonly hallucinate:
- Training steps that don't exist
- Fine-tuning capabilities that aren't implemented
- Performance metrics not in the code
- Model internals based on paper knowledge

---

## Additional Classification (Step 0)

Classify the model system as one of:

| Type | Indicators |
|------|------------|
| Inference-only | No training code, loads pretrained weights |
| Training + Inference | Has training loops, loss functions, optimizers |
| Research prototype | Experimental, may have incomplete paths |
| Production model | Clean API, versioned weights, deployment scripts |
| Model library | Provides models for others to use (like HuggingFace) |

**Document:**
```markdown
| Field | Value |
|-------|-------|
| Model Type | {from table above} |
| Has Training Code | Yes / No / [NOT_FOUND] |
| Has Inference Code | Yes / No |
| Weight Format | {.safetensors, .pt, .onnx, etc.} |
| Weight Source | {local, HuggingFace Hub, S3, etc.} |
```

---

## Section 3 Modifications: Execution Surfaces

For model systems, Section 3 should document:

### 3.1 Primary Execution Surfaces (Model-Specific)

| Entry Surface | Type | Pipeline Stage | Evidence |
|--------------|------|----------------|----------|
| `model.generate()` | Library API | Full pipeline | [VERIFIED: file] |
| `python inference.py` | CLI | Full pipeline | [VERIFIED: file] |
| Gradio/Streamlit UI | Web Demo | Full pipeline | [VERIFIED: file] |

### 3.2 Pipeline Stages (Non-Procedural)

Document **what transforms happen**, not how:

| Stage | Input | Output | Component |
|-------|-------|--------|-----------|
| Preprocessing | Raw input | Model-ready tensors | {tokenizer/encoder} |
| Inference | Tensors | Model output | {model class} |
| Postprocessing | Model output | User-facing result | {decoder/formatter} |

**MUST NOT:**
- Describe internal model layers
- Explain attention mechanisms, sampling algorithms
- Quote forward() implementations
- Trace tensor operations

---

## Additional Required Sections

### Model Architecture (Verified Only)

Document only what is **explicitly stated in code or configs**:

| Field | Value | Evidence |
|-------|-------|----------|
| Model Class | {class name} | [VERIFIED: file:line] |
| Parameter Count | {only if explicitly stated} | [VERIFIED: file:line] or [NOT_FOUND] |
| Architecture Type | {Transformer, CNN, etc. - only if in code} | [VERIFIED] or [INFERRED] |
| Weight File(s) | {filenames} | [VERIFIED: file] |
| Weight Source | {download URL/path} | [VERIFIED: file:line] |

**MUST NOT:**
- Guess training data
- Assume fine-tuning capabilities
- Invent loss functions
- Speculate on evaluation metrics
- Describe architecture from external knowledge

### Configuration & Control Surface

| Config | Location | Controls | Evidence |
|--------|----------|----------|----------|
| {config file/flag} | {path} | {what it changes} | [VERIFIED] |

Include:
- Config files (`.yaml`, `.json`, `.toml`)
- Runtime flags and arguments
- Environment variables
- Special tokens or control codes

### Boundaries & Non-Responsibilities

Explicitly document what the system does NOT do:

```markdown
## Boundaries

This system does NOT:
- [ ] Provide training pipelines [VERIFIED: no training code found]
- [ ] Support fine-tuning [VERIFIED/NOT_FOUND]
- [ ] Include evaluation scripts [VERIFIED/NOT_FOUND]

Out of scope:
- {capability that would require external services}
- {capability that would require retraining}
```

### Risk & Change Surface

Identify files where changes have outsized impact:

| File/Component | Risk Level | Why |
|----------------|------------|-----|
| Model weights | Critical | Changes break compatibility |
| Tokenizer/vocab | Critical | Changes break inference |
| Config schemas | High | Changes affect all pipelines |
| Preprocessing | Medium | Changes affect input handling |

---

## Anti-Hallucination Checklist (Model Systems)

Before submitting, verify:

- [ ] No training behavior inferred without training code evidence
- [ ] No performance claims (speed, accuracy) without benchmarks in repo
- [ ] No architecture details from external knowledge (papers, blogs)
- [ ] No assumptions about training data
- [ ] No fine-tuning claims without fine-tuning code
- [ ] Weight sources are explicitly documented with evidence
- [ ] "Unknown" is used when information isn't in the code
- [ ] All model capabilities are verified against actual inference code

---

## Example: BAD Model Documentation

```markdown
## Model Architecture

The model uses a 12-layer transformer with multi-head attention,
trained on 100GB of text data. It achieves 95% accuracy on
standard benchmarks and can be fine-tuned for specific tasks.
```

**Why this is BAD:**
- Layer count may be from paper, not code
- Training data is speculation
- Accuracy claim has no evidence
- Fine-tuning assumed without code

## Example: GOOD Model Documentation

```markdown
## Model Architecture

| Field | Value | Evidence |
|-------|-------|----------|
| Model Class | `ChatterboxTTS` | [VERIFIED: tts.py:106] |
| Parameter Count | [NOT_FOUND: not stated in code] | - |
| Architecture | Transformer-based | [INFERRED: uses LlamaModel backbone, tts.py:89] |
| Weight File | `t3_cfg.safetensors` | [VERIFIED: tts.py:177] |
| Weight Source | HuggingFace `ResembleAI/chatterbox` | [VERIFIED: tts.py:19] |

[NOT_FOUND: No training code in repository]
[NOT_FOUND: No fine-tuning scripts]
[NOT_FOUND: No benchmark or evaluation code]
```

**Why this is GOOD:**
- Every claim has evidence
- Unknown items explicitly marked
- No speculation about training
- Architecture inferred from code, not papers
