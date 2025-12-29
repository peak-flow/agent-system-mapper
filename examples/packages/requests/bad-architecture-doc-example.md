# Architecture Overview: Requests Library

> **WARNING: This is an example of BAD documentation. Do NOT use this as a template.**
> It demonstrates common anti-patterns when documenting packages.

## 1. System Classification

| Field | Value |
|-------|-------|
| Type | HTTP Client Library |
| Evidence | It's the most popular Python HTTP library |
| Confidence | `[HIGH]` |

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

## 4. External Dependencies

- **urllib3** - Connection pooling and HTTP handling
- **certifi** - CA certificate bundle
- **chardet** - Character encoding detection
- **idna** - International domain names
- **cryptography** - TLS and encryption support
- **pyOpenSSL** - Additional SSL features

## 5. Performance Characteristics

- Connection pooling reduces latency by 40-60%
- Keep-alive connections reused for 100+ requests
- Automatic retry logic with exponential backoff
- Memory-efficient streaming for large files
- Async support via requests-async extension

## 6. Architecture Summary

The requests library follows a clean layered architecture with excellent separation of concerns. The API layer provides a simple interface, while the session and adapter layers handle complexity. This design makes it easy to extend and customize behavior.

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
