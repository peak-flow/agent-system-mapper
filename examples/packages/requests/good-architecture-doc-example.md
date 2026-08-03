# Architecture Overview: Requests Library

> **This is an example of GOOD documentation following the 01-architecture-overview methodology.**
>
> Every citation below resolves against the pinned copy of the `requests` source
> vendored at `examples/packages/requests/source/` (see `source/VENDORED.md` for
> the upstream pin), so this example is self-verifiable.

## Metadata
| Field | Value |
|-------|-------|
| Repository | `agent-system-mapper` |
| Path | `examples/packages/requests/source/` |
| Upstream | `psf/requests 2.32.5, commit 7029833` |
| Commit | `9a69c14` |
| Documented | `2026-08-03` |
| Verification Status | `Verified` |

Verify with:

```bash
python3 verify.py examples/packages/requests/good-architecture-doc-example.md --repo-root examples/packages/requests/source
```

## Verification Summary
- VERIFIED: 70 tags (125 file:line citations, 100% resolving; 1 structural claim without a line citation; 6 quoted blocks matching at 100% similarity)
- INFERRED: 1 claim
- NOT_FOUND: 9 items (each with the search documented)
- ASSUMED: 0 items
- NEEDS_VERIFICATION: 0 items

---

## 0. System Classification

| Field | Value |
|-------|-------|
| Category | Traditional Code |
| Type | Library/Package |
| Evidence | The package re-exports its whole public surface from `__init__.py` [VERIFIED: requests/__init__.py:164, 177, 178, 179]; no web routes or console_scripts exist in the vendored tree [NOT_FOUND: searched "route", "argparse", "click" in requests/ — zero matches] |
| Overlay Loaded | No |
| Confidence | `[VERIFIED]` |

The public functional API is re-exported at import time [VERIFIED: requests/__init__.py:164]

```python
from .api import delete, get, head, options, patch, post, put, request
```

---

## 1. System Purpose

Requests is a synchronous HTTP client library for Python — "Python HTTP for
Humans" per its own metadata. It wraps urllib3 behind a small, human-friendly
API: module-level verb functions for one-shot calls, and a `Session` object for
cookie persistence, configuration, and connection pooling across calls
[VERIFIED: requests/__init__.py:10, requests/sessions.py:5-6].

Package identity is defined in one place [VERIFIED: requests/__version__.py:5-8]

```python
__title__ = "requests"
__description__ = "Python HTTP for Humans."
__url__ = "https://requests.readthedocs.io"
__version__ = "2.32.5"
```

---

## 2. Component Map

| Component | Location | Responsibility | Evidence |
|-----------|----------|----------------|----------|
| Module-level API | `requests/api.py` | Verb functions (`request`, `get`, `options`, `head`, `post`, `put`, `patch`, `delete`) that delegate to a throwaway `Session` | [VERIFIED: requests/api.py:14, 62, 76, 88, 103, 118, 133, 148] |
| `Session` | `requests/sessions.py` | Cookie persistence, setting merges, redirect handling, adapter mounting | [VERIFIED: requests/sessions.py:356] |
| `SessionRedirectMixin` | `requests/sessions.py` | Redirect resolution, auth/proxy rebuilding across hops | [VERIFIED: requests/sessions.py:106, 282, 302] |
| `Request` / `PreparedRequest` / `Response` | `requests/models.py` | The three primary data objects of the library | [VERIFIED: requests/models.py:230, 313, 640] |
| `BaseAdapter` / `HTTPAdapter` | `requests/adapters.py` | Transport layer; bridges `PreparedRequest` to urllib3 and builds `Response` | [VERIFIED: requests/adapters.py:113, 143, 336] |
| Auth handlers | `requests/auth.py` | `AuthBase`, `HTTPBasicAuth`, `HTTPProxyAuth`, `HTTPDigestAuth` | [VERIFIED: requests/auth.py:69, 76, 99, 107] |
| Cookie machinery | `requests/cookies.py` | `RequestsCookieJar` plus jar/dict conversion and merge helpers | [VERIFIED: requests/cookies.py:176, 521, 542] |
| Exception tree | `requests/exceptions.py` | `RequestException(IOError)` root with specific subclasses | [VERIFIED: requests/exceptions.py:12] |
| Hooks system | `requests/hooks.py` | Single `response` hook event plus dispatcher | [VERIFIED: requests/hooks.py:12, 15, 22] |
| Status codes | `requests/status_codes.py` | `codes` LookupDict mapping names to numeric statuses | [VERIFIED: requests/status_codes.py:106] |
| Data structures | `requests/structures.py` | `CaseInsensitiveDict`, `LookupDict` | [VERIFIED: requests/structures.py:13, 83] |
| Utilities | `requests/utils.py` | Header/proxy/encoding helpers, "also useful for external consumption" | [VERIFIED: requests/utils.py:1-7] |
| Internal utilities | `requests/_internal_utils.py` | Native-string coercion and header validators, internal-only | [VERIFIED: requests/_internal_utils.py:1-7] |
| Compat shims | `requests/compat.py` | Legacy Python-2/3 layer and character-detection resolution | [VERIFIED: requests/compat.py:1-8] |
| CA bundle indirection | `requests/certs.py` | Re-exports certifi's `where()` as the default CA bundle source | [VERIFIED: requests/certs.py:14] |
| Diagnostics | `requests/help.py` | Bug-report environment dump (`info()`, `main()`) | [VERIFIED: requests/help.py:69, 128] |
| Legacy namespace | `requests/packages.py` | sys.modules aliasing so `requests.packages.urllib3` still resolves | [VERIFIED: requests/packages.py:8-9] |
| Version metadata | `requests/__version__.py` | Title, version, license constants | [VERIFIED: requests/__version__.py:5, 8, 12] |

The central class documents its own responsibilities [VERIFIED: requests/sessions.py:356-359]

```python
class Session(SessionRedirectMixin):
    """A Requests session.

    Provides cookie persistence, connection-pooling, and configuration.
```

[NOT_FOUND: no subpackages — `requests/` is a flat set of 18 modules, no nested directories]

---

## 3. Execution Surfaces & High-Level Data Movement (Discovery Only)

For a library, the execution surfaces are its **public API entry points** — the
importable names through which caller code enters the package.

### 3.1 Primary Execution Surfaces (Public API Entry Points)

| Entry Surface | Type | Primary Components Involved | Evidence |
|---------------|------|-----------------------------|----------|
| `requests.request(method, url, **kwargs)` | Library API | api.request → throwaway `Session` → `Session.request` | [VERIFIED: requests/api.py:14] |
| `requests.get(url, params=None)` | Library API | Delegates to `api.request("get", ...)` | [VERIFIED: requests/api.py:62] |
| `requests.options(url)` / `requests.head(url)` | Library API | Delegate to `api.request` (head disables redirects by default) | [VERIFIED: requests/api.py:76, 88, 99] |
| `requests.post(url, data=None, json=None)` | Library API | Delegates with body kwargs | [VERIFIED: requests/api.py:103] |
| `requests.put(url)` / `requests.patch(url)` / `requests.delete(url)` | Library API | Delegate to `api.request` | [VERIFIED: requests/api.py:118, 133, 148] |
| `Session()` — direct use or context manager | Library API | `Session.__init__` mounts default adapters; `__enter__`/`__exit__` manage close | [VERIFIED: requests/sessions.py:390, 451-455] |
| `Session.request/get/options/head/post/put/patch/delete/send` | Library API | Full per-session verb surface plus low-level `send` | [VERIFIED: requests/sessions.py:500, 593, 604, 615, 626, 639, 651, 663, 673] |
| `Response` consumption — `iter_content`, `content`, `text`, `json`, `raise_for_status` | Library API | Response object accessors | [VERIFIED: requests/models.py:799, 891, 910, 947, 999] |
| `HTTPAdapter(max_retries=...)` + `Session.mount(prefix, adapter)` | Extension point | Custom transport configuration | [VERIFIED: requests/adapters.py:178, requests/sessions.py:799] |
| `python -m requests.help` | Diagnostic CLI | `info()` JSON dump via `main()` | [VERIFIED: requests/help.py:128, 133-134] |
| `python -m requests.certs` | Diagnostic CLI | Prints the certifi CA bundle path | [VERIFIED: requests/certs.py:16-17] |

[NOT_FOUND: no `__main__.py` and no console_scripts — the only runnable modules are the two diagnostics above]

### 3.2 High-Level Data Movement (Non-Procedural)

| Stage | Input | Output | Participating Components | Evidence |
|-------|-------|--------|--------------------------|----------|
| Entry | method, URL, kwargs | Delegated session call | `api.request` | [VERIFIED: requests/api.py:58-59] |
| Settings merge | Request kwargs + Session defaults | Merged settings/hooks | `merge_setting`, `merge_hooks` | [VERIFIED: requests/sessions.py:61, 91] |
| Preparation | `Request` | `PreparedRequest` | `Session.prepare_request`, `PreparedRequest` | [VERIFIED: requests/sessions.py:457, requests/models.py:313] |
| Transport | `PreparedRequest` | urllib3 response | `Session.send` → `HTTPAdapter.send` | [VERIFIED: requests/sessions.py:673, requests/adapters.py:590-591] |
| Response build | urllib3 response | `requests.Response` | `HTTPAdapter.build_response` | [VERIFIED: requests/adapters.py:336] |
| Hook dispatch | `Response` | Possibly-replaced `Response` | `dispatch_hook` | [VERIFIED: requests/hooks.py:22] |

The module-level surface hands every call to a short-lived session
[VERIFIED: requests/api.py:58-59]

```python
    with sessions.Session() as session:
        return session.request(method=method, url=url, **kwargs)
```

### 3.3 Pointers to Code Flow Documentation

Candidates for detailed flow tracing (see 02-code-flows.md):

- **Module-level GET** — `requests.get` through session creation, preparation, transport, and teardown
- **Session-persistent request with redirects** — `Session.request` → `resolve_redirects`
- **Digest auth challenge/response** — `HTTPDigestAuth` handler lifecycle

### Section 3 Self-Check
- [x] No method bodies longer than 3 lines quoted
- [x] No loops or conditionals described
- [x] All movements as conceptual stages
- [x] Defers to 02-code-flows.md

---

## Boundaries & Non-Responsibilities

Explicitly **NOT** in this library:

- **Async/await API** [NOT_FOUND: searched "async def" and "await " across requests/*.py — zero matches; the API is fully synchronous]
- **WebSocket support** [NOT_FOUND: case-insensitive search for "websocket" across requests/*.py — zero matches]
- **OAuth, Kerberos, or NTLM authentication** — shipped handlers are Basic, Proxy-Basic, and Digest only [VERIFIED: requests/auth.py:69, 76, 99, 107] [NOT_FOUND: case-insensitive search for "oauth", "kerberos", "ntlm" — the only hit is a comment at requests/models.py line 374 noting that auth *hooks* allow third-party schemes]
- **Automatic retries** — retries default to zero and are opt-in per adapter [VERIFIED: requests/adapters.py:153-157]
- **HTTP/2** [NOT_FOUND: searched "http2" and "HTTP/2" across requests/*.py — zero matches; transport is urllib3's HTTP/1.1 stack]
- **Connection-pool implementation** — pooling is delegated to urllib3's `PoolManager`, not implemented here [VERIFIED: requests/adapters.py:26]
- **CA certificate store** — trust roots come from certifi, not from this package [VERIFIED: requests/certs.py:14]

Transport defaults make the no-retry boundary concrete
[VERIFIED: requests/adapters.py:70-73]

```python
DEFAULT_POOLBLOCK = False
DEFAULT_POOLSIZE = 10
DEFAULT_RETRIES = 0
DEFAULT_POOL_TIMEOUT = None
```

---

## 4. File/Folder Conventions

| Pattern | Meaning | Evidence |
|---------|---------|----------|
| Flat single package | All 18 modules sit directly in `requests/` with no nested directories | [VERIFIED: directory listing of requests/ shows 18 .py files and no subdirectories] |
| `requests.<module>` docstring headers | Each module opens with a docstring naming itself and stating its role | [VERIFIED: requests/utils.py:1-7, requests/sessions.py:1-7] |
| `_`-prefix marks internals | `_internal_utils.py` documents itself as consumed internally only | [VERIFIED: requests/_internal_utils.py:1-7] |
| `compat.py` as legacy shim | Self-described as remaining "for backwards compatibility until the next major version" | [VERIFIED: requests/compat.py:5-7] |
| `packages.py` as namespace alias | Keeps `requests.packages.urllib3` importable via sys.modules aliasing | [VERIFIED: requests/packages.py:8-14] |
| `__version__.py` as metadata home | Single source for title/version/license constants | [VERIFIED: requests/__version__.py:5-14] |

---

## 5. External Dependencies

| Dependency | Required? | Purpose | Evidence |
|------------|-----------|---------|----------|
| urllib3 | Required | Transport: `PoolManager`, `Retry`, `Timeout`, proxy support | [VERIFIED: requests/adapters.py:26-29] |
| certifi | Required | Default CA bundle (`where()`), consumed as `DEFAULT_CA_BUNDLE_PATH` | [VERIFIED: requests/certs.py:14, requests/utils.py:64] |
| idna | Required | IDNA host encoding during URL preparation (lazy import) | [VERIFIED: requests/models.py:400-401] |
| charset_normalizer / chardet | Optional (either) | Response character-set detection; first importable of the two wins | [VERIFIED: requests/compat.py:33-39] |
| simplejson | Optional | Used as the `json` implementation when importable | [VERIFIED: requests/compat.py:58-64] |
| pyOpenSSL + cryptography | Optional fallback | Injected into urllib3 only when stdlib `ssl` lacks SNI support | [VERIFIED: requests/__init__.py:130-138] |

Character detection is genuinely either/or, not a hard chardet dependency
[VERIFIED: requests/compat.py:33-39]

```python
    for lib in ("chardet", "charset_normalizer"):
        if chardet is None:
            try:
                chardet = importlib.import_module(lib)
            except ImportError:
                pass
    return chardet
```

[NOT_FOUND: no dependency manifest in the vendored copy — packaging metadata (pyproject/setup) was pruned per source/VENDORED.md, so version pins cannot be cited here]

---

## 6. Known Issues & Risks

| Risk | Location | Notes |
|------|----------|-------|
| Module-level API builds and closes a fresh `Session` per call | `requests/api.py:55-59` | [VERIFIED: requests/api.py:58-59] the with-block closes the session on return; [INFERRED] therefore module-level calls get no cross-call connection reuse — callers wanting pooling must hold a `Session` themselves |
| `verify=False` disables TLS verification entirely | `requests/sessions.py:416-424` | [VERIFIED: requests/sessions.py:419-422] the attribute docstring itself warns this makes applications "vulnerable to man-in-the-middle (MitM) attacks" |
| Deprecated `session()` factory still exported | `requests/sessions.py:819-831` | [VERIFIED: requests/sessions.py:823, requests/__init__.py:178] deprecated since 1.0.0 yet still part of the top-level import surface |
| Legacy sys.modules aliasing | `requests/packages.py:5-6` | [VERIFIED: requests/packages.py:5-6] the module's own comment concedes this exists "for backwards compatibility reasons" |
| Non-string basic-auth credentials only warn | `requests/auth.py:35-53` | [VERIFIED: requests/auth.py:35-43] coercion with `DeprecationWarning`, removal deferred to 3.0.0 per in-code comment |

---

## 8. Technology Stack Summary

| Layer | Technology | Evidence |
|-------|------------|----------|
| Language | Python 3 (`is_py2`/`is_py3` kept only as legacy compat constants) | [VERIFIED: requests/compat.py:52-55] |
| Supported Python range | Not citable from the vendored copy | [NOT_FOUND: python_requires lives in packaging metadata, which was pruned from source/ per VENDORED.md] |
| HTTP transport | urllib3 | [VERIFIED: requests/adapters.py:26-29] |
| TLS trust | certifi via `requests/certs.py` | [VERIFIED: requests/certs.py:14] |
| Character detection | charset_normalizer or chardet (optional) | [VERIFIED: requests/compat.py:42] |
| IDN handling | idna | [VERIFIED: requests/models.py:401] |
| License | Apache-2.0 | [VERIFIED: requests/__version__.py:12] |

---

## Why This Example is GOOD

- **Every citation resolves** — all `[VERIFIED: path:line]` tags use paths relative to the vendored source root (`requests/api.py:14`, not bare `api.py:14`), so the Verify-with command exits 0.
- **No hedges or disjunctions inside tags** — guesses like `[VERIFIED: pyproject.toml or setup.py]` and `[VERIFIED: models.py likely uses ...]` became exact citations or honest `[NOT_FOUND]` entries with the search documented.
- **No byte counts as evidence** — a file's size proves it exists, not what it does; every component row now cites the line that carries the claim.
- **Quotes are exact copy-paste** — each fenced block matches the cited slice of the file, so the verifier's phase-2 quote check passes at 100% similarity.
- **Explicit boundaries** — the Boundaries & Non-Responsibilities section (required for packages) states what the library does NOT do, each negative claim backed by a documented search or a citation to the default that proves it.
- **Tables, not arrows** — Section 3 lists entry surfaces and conceptual stages, deferring all step-by-step tracing to 02-code-flows.md.
- **Accurate self-accounting** — the Verification Summary counts match the verifier's own tag census for this document.
