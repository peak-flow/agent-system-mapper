# Architecture Overview: Requests Library

> **WARNING: This is an example of BAD documentation. Do NOT use this as a template.**
> It demonstrates common anti-patterns when documenting packages.

## 1. System Classification

| Field | Value |
|-------|-------|
| Type | HTTP Client Library |
| Evidence | It's the most popular Python HTTP library |
| Confidence | `[HIGH]` |

> **❌ PROBLEMS:**
> - `[HIGH]` is not a methodology tag — only `[VERIFIED]`, `[INFERRED]`, `[NOT_FOUND]`, `[ASSUMED]`, `[NEEDS_VERIFICATION]` exist
> - "It's the most popular Python HTTP library" is popularity, not evidence — real classification evidence is in the code, e.g. the public-surface re-export at `requests/__init__.py:164`
> - Missing Category and Overlay Loaded rows required by the 01 output format

## 2. Component Map

### Core Components

The requests library uses a sophisticated layered architecture:

- **API Layer** - Provides simple functions like `get()`, `post()`
- **Session Layer** - Manages connection pooling and cookies
- **Adapter Layer** - Handles transport protocols
- **Model Layer** - Request/Response data structures
- **Utility Layer** - Helper functions and authentication

### Data Flow

```
User calls requests.get()
        ↓
Session is created with connection pooling
        ↓
Request is prepared with headers and body
        ↓
Adapter sends request via urllib3
        ↓
Response is parsed and returned
        ↓
Connection is returned to pool for reuse
```

> **❌ PROBLEMS:**
> - No file paths or citations for any "layer" — every bullet needs a location and a verification tag
> - Arrow diagram traces execution step-by-step — that belongs in 02-code-flows, not the architecture overview
> - "Connection is returned to pool for reuse" is wrong for the flow shown: `requests.get()` runs the session in a with-block that closes it on return (`requests/api.py:58-59`), discarding the pool — reuse only happens when the caller holds a `Session`
> - "Utility Layer - Helper functions and authentication" conflates two unrelated modules: helpers live in `requests/utils.py:1-7`, auth handlers in `requests/auth.py:1-6`

## 3. Key Data Flows

### GET Request Flow

```
requests.get(url)
        ↓
api.request('get', url)  [api.py:62]
        ↓
Session.__enter__()      [sessions.py:~400]
        ↓
Session.request()        [sessions.py:~500]
    - Merges session settings with request kwargs
    - Prepares request object
    - Resolves proxies and redirects
        ↓
Session.send()           [sessions.py:~600]
    - Gets adapter for URL scheme
    - Sends prepared request
    - Handles redirects
        ↓
HTTPAdapter.send()       [adapters.py:~400]
    - Uses urllib3 PoolManager
    - Manages retries
    - Handles SSL verification
        ↓
Response is returned with content decoded
```

### Authentication Flow

The library supports multiple authentication methods:

1. Basic Auth - Encodes username:password in Base64
2. Digest Auth - Uses challenge-response with MD5 hashing
3. OAuth - Full OAuth 1.0 and 2.0 support
4. Kerberos - Enterprise SSO integration
5. NTLM - Windows domain authentication

> **❌ PROBLEMS:**
> - `[sessions.py:~400]`-style approximations are unverifiable — and wrong: `Session.__enter__` is at `requests/sessions.py:451`, `Session.send` at `requests/sessions.py:673`, `HTTPAdapter.send` at `requests/adapters.py:590` (the `~500` guess for `Session.request` at `requests/sessions.py:500` is luck, not verification)
> - Bare filenames like `[api.py:62]` resolve against nothing — citations must be relative to the source root (`requests/api.py:62`)
> - Step-by-step GET tracing with internal bullets ("Merges session settings", "Handles redirects") belongs in 02-code-flows
> - OAuth, Kerberos, and NTLM are hallucinated: `requests/auth.py` ships only `AuthBase` (:69), `HTTPBasicAuth` (:76), `HTTPProxyAuth` (:99), `HTTPDigestAuth` (:107); the sole "OAuth" occurrence in the whole package is a comment at `requests/models.py:374` about third-party auth hooks
> - "MD5 hashing" describes algorithm internals — too detailed for an architecture overview

## 4. External Dependencies

- **urllib3** - Connection pooling and HTTP handling
- **certifi** - CA certificate bundle
- **chardet** - Character encoding detection
- **idna** - International domain names
- **cryptography** - TLS and encryption support
- **pyOpenSSL** - Additional SSL features

> **❌ PROBLEMS:**
> - No Evidence column, no citations — a dependency list must point at the import that proves it
> - chardet is listed as required, but `requests/compat.py:33-39` tries chardet *or* charset_normalizer, and both are optional (either satisfies detection)
> - cryptography and pyOpenSSL are not dependencies — they are a conditional fallback imported only when stdlib `ssl` lacks SNI (`requests/__init__.py:130-138`)
> - idna is real but uncited — the actual use is a lazy import during URL preparation at `requests/models.py:400-401`

## 5. Performance Characteristics

- Connection pooling reduces latency by 40-60%
- Keep-alive connections reused for 100+ requests
- Automatic retry logic with exponential backoff
- Memory-efficient streaming for large files
- Async support via requests-async extension

> **❌ PROBLEMS:**
> - "40-60%" and "100+ requests" are fabricated numbers with no source — performance claims need `[NEEDS_VERIFICATION]` at minimum
> - "Automatic retry logic with exponential backoff" is false: `DEFAULT_RETRIES = 0` at `requests/adapters.py:72`, and the `HTTPAdapter` docstring says "By default, Requests does not retry failed connections" (`requests/adapters.py:153-157`) — retries are opt-in
> - "Async support" is false: zero `async`/`await` anywhere in `requests/*.py`; requests-async is a third-party package, not this library's architecture
> - Connection pooling is implemented by urllib3's `PoolManager` (`requests/adapters.py:26`), not by requests — attributing it here misleads readers about where the behavior lives

## 6. Architecture Summary

The requests library follows a clean layered architecture with excellent separation of concerns. The API layer provides a simple interface, while the session and adapter layers handle complexity. This design makes it easy to extend and customize behavior.

> **❌ PROBLEMS:**
> - Pure editorializing — "clean", "excellent", "easy to extend" are opinions with no citations and no falsifiable content
> - Says nothing a reader could check: no boundaries, no `[NOT_FOUND]` scoping, no pointer to the actual extension point (`Session.mount` at `requests/sessions.py:799`)

---

**Why this is BAD:**

- **No verification tags** - Every claim needs `[VERIFIED: file:line]` or `[NOT_FOUND]`
- **Vague line references** - `[sessions.py:~500]` is useless - exact line needed
- **Step-by-step tracing** - This belongs in 02-code-flows, not architecture overview
- **Hallucinated features** - OAuth, Kerberos, NTLM are NOT in requests core
- **Invented performance claims** - "40-60% latency reduction" is fabricated
- **Missing evidence** - "sophisticated layered architecture" - where's the proof?
- **Describes algorithms** - "MD5 hashing", "exponential backoff" - too detailed
- **External deps wrong** - cryptography/pyOpenSSL not required dependencies
- **Arrow diagrams** - Should use tables per 01-architecture rules
