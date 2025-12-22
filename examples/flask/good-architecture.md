# Architecture Overview: Flask Link Shortener

## System Purpose
[VERIFIED] A URL shortening service that creates short codes for long URLs and redirects visitors. Basic click counting is included.

Reference: `app/routes/links.py:2` - "Link routes - handle URL shortening operations"

## Technology Stack
[VERIFIED]
- Flask 3.0.0 (`requirements.txt:1`)
- Flask-SQLAlchemy 3.1.1 (`requirements.txt:2`)
- SQLite database (no external DB required)

Reference: `config.py:18-21` - SQLite URI configuration

## Data Model

### Link Entity
[VERIFIED] Single table `links` with fields:

| Column | Type | Notes |
|--------|------|-------|
| id | Integer | Primary key |
| short_code | String(10) | Unique, not null |
| original_url | String(2048) | Not null |
| created_at | DateTime | Default: utcnow |
| expires_at | DateTime | Nullable |
| click_count | Integer | Default: 0 |

Reference: `app/models/link.py:23-35`

[CRITICAL GAP] `short_code` lacks database index despite being primary lookup field:
```python
short_code = db.Column(db.String(10), unique=True, nullable=False)
# Wart: No index on short_code despite frequent lookups
```
Reference: `app/models/link.py:24-25`

### Expiration Field
[VERIFIED] `expires_at` column exists but is NEVER enforced:

```python
expires_at = db.Column(db.DateTime, nullable=True)
# Wart: expires_at is stored but never enforced
```
Reference: `app/models/link.py:31-32`

[VERIFIED] Expiration check method exists in service:
```python
def _is_expired(cls, link):
    """Check if link is expired.
    Note: This check exists but is never called in redirect flow!"""
```
Reference: `app/services/shortener.py:126-135`

[VERIFIED] Redirect route does NOT call expiration check:
```python
# Wart: Expiration check exists in service but not called here!
# if ShortenerService._is_expired(link):
#     abort(410)  # Gone
```
Reference: `app/routes/links.py:83-85` (commented out code confirms gap)

## Service Layer

### ShortenerService (`app/services/shortener.py`)
[VERIFIED] Stateless class with class methods:

| Method | Purpose | Issues |
|--------|---------|--------|
| `create_short_link()` | Create new link | No URL validation |
| `_generate_short_code()` | Random 6-char code | Not cryptographic |
| `get_link_by_code()` | Lookup by code | No expiration check |
| `record_click()` | Increment counter | Non-atomic |
| `delete_link()` | Remove link | Hard delete only |

### Short Code Generation
[VERIFIED] Uses `random.choice()` which is not cryptographically secure:

```python
ALPHABET = string.ascii_letters + string.digits  # Line 29
return ''.join(random.choice(cls.ALPHABET) for _ in range(length))  # Line 83
```

[VERIFIED] Alphabet includes confusable characters (0/O, 1/l/I):
```python
# Wart: Includes easily confused characters (0/O, 1/l)
```
Reference: `app/services/shortener.py:28`

### Click Counter Race Condition
[VERIFIED] Click counting is NOT atomic:

```python
def increment_clicks(self):
    """Increment click counter.

    Wart: This is NOT atomic - concurrent requests could
    read same value and both write value+1, losing clicks."""
    self.click_count += 1
```
Reference: `app/models/link.py:55-63`

This pattern (read-modify-write) loses data under concurrent load. Correct approach documented in comment:
```python
# Proper solution: db.session.execute(update().values(click_count=Link.click_count + 1))
```
Reference: `app/models/link.py:61`

## Route Handlers

### Blueprint Registration
[VERIFIED] Single blueprint for all routes:
```python
bp = Blueprint('links', __name__)
```
Reference: `app/routes/links.py:18`

### Create Link (`POST /api/links`)
[VERIFIED] Minimal validation - only checks URL scheme:

```python
if not url.startswith(('http://', 'https://')):
    return jsonify({'error': 'URL must start with http:// or https://'}), 400
```
Reference: `app/routes/links.py:52-53`

[NOT_FOUND] No URL blocklist, domain validation, or length limits exist.

[VERIFIED] Collision returns wrong HTTP status:
```python
except ValueError as e:
    # Wart: Collision returns 500, should be 409
    return jsonify({'error': str(e)}), 500
```
Reference: `app/routes/links.py:61-63`

### Redirect (`GET /r/<short_code>`)
[VERIFIED] Click tracking is synchronous (blocking):
```python
# Record click (blocking - slows redirect)
# Wart: Should be async/background job
ShortenerService.record_click(link)
```
Reference: `app/routes/links.py:87-89`

[VERIFIED] Uses HTTP 302 (temporary) not 301 (permanent):
```python
# Wart: 302 redirect - should be 301 for permanent
return redirect(link.original_url)
```
Reference: `app/routes/links.py:91-93`

### Delete (`DELETE /api/links/<short_code>`)
[VERIFIED] No authentication - anyone can delete:
```python
"""Delete a link.
Wart: No authentication - anyone can delete any link"""
```
Reference: `app/routes/links.py:114-117`

## Security Analysis

### Authentication
[NOT_FOUND] No authentication mechanism exists. All endpoints are public:
- Anyone can create links
- Anyone can view stats for any link
- Anyone can delete any link

Reference: `app/routes/links.py:10` - "Wart: No authentication/authorization"

### Rate Limiting
[NOT_FOUND] No rate limiting implemented.
Reference: `app/routes/links.py:12` - "Wart: No rate limiting"

### Input Validation
[VERIFIED] Custom short codes are not validated:
```python
if custom_code:
    short_code = custom_code
    # Wart: No validation of custom code format
```
Reference: `app/services/shortener.py:48-50`

Could allow injection of malicious codes (e.g., path traversal characters).

### Secret Key
[VERIFIED] Default secret key is hardcoded:
```python
SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-me')
```
Reference: `config.py:13`

## Database Configuration

### SQLite Limitations
[VERIFIED] Uses SQLite without migrations:
```python
SQLALCHEMY_DATABASE_URI = os.environ.get(
    'DATABASE_URL',
    'sqlite:///links.db'
)
```
Reference: `config.py:16-20`

[VERIFIED] Tables created via `create_all()` not migrations:
```python
# Wart: Should use migrations, not create_all
with app.app_context():
    db.create_all()
```
Reference: `app/__init__.py:37-39`

## Summary of Gaps

| Category | Issue | Location |
|----------|-------|----------|
| Security | No authentication | `links.py:10` |
| Security | No rate limiting | `links.py:12` |
| Security | Hardcoded secret | `config.py:13` |
| Data Integrity | Non-atomic clicks | `link.py:55-63` |
| Data Integrity | No expiration enforcement | `links.py:83-85` |
| Performance | No index on short_code | `link.py:24-25` |
| Performance | Sync click tracking | `links.py:87-89` |
| Validation | No URL blocklist | Not found |
| Validation | No custom code validation | `shortener.py:48-50` |
| API Design | Wrong status on collision | `links.py:61-63` |
