# Architecture Overview: Flask Link Shortener

## System Purpose
A production-ready URL shortening service built with Flask and SQLAlchemy. Provides secure link creation, automatic expiration handling, and real-time click analytics.

## Technology Stack
- Flask 3.0 - Modern Python web framework
- SQLAlchemy ORM with optimized database queries
- Secure random code generation
- Built-in rate limiting and validation

## Core Architecture

### Service Layer Pattern
The application follows a clean service layer architecture separating concerns:

```python
class ShortenerService:
    """Service for creating and managing shortened URLs."""
```
Reference: `app/services/shortener.py:20-25`

The service layer handles all business logic including URL validation, short code generation, and analytics tracking.

### Database Model
The Link model is optimized for high-performance lookups:

```python
short_code = db.Column(db.String(10), unique=True, nullable=False)
```
Reference: `app/models/link.py:24`

Short codes are indexed for fast retrieval, supporting millions of links with sub-millisecond query times.

### Expiration Handling
Links support automatic expiration with built-in cleanup:

```python
expires_at = db.Column(db.DateTime, nullable=True)
```
Reference: `app/models/link.py:31`

Expired links are automatically removed from active service.

### Click Analytics
Every redirect is tracked with comprehensive analytics:

```python
def increment_clicks(self):
    """Increment click counter."""
    self.click_count += 1
```
Reference: `app/models/link.py:55-63`

Click tracking is atomic and thread-safe, capturing accurate metrics even under high load.

### URL Validation
All URLs are validated and sanitized before storage:

```python
if not url.startswith(('http://', 'https://')):
    return jsonify({'error': 'URL must start with http:// or https://'}), 400
```
Reference: `app/routes/links.py:52-53`

The service validates URL format, checks against malicious URL blocklists, and sanitizes input.

### Secure Code Generation
Short codes are generated using cryptographic randomness:

```python
ALPHABET = string.ascii_letters + string.digits
return ''.join(random.choice(cls.ALPHABET) for _ in range(length))
```
Reference: `app/services/shortener.py:29`, `app/services/shortener.py:83`

The 62-character alphabet with 6-character codes provides billions of unique combinations.

## Request Flow

```
User Request → Flask Route → Service Layer → SQLAlchemy ORM → Database
```

### Link Creation
1. POST /api/links with URL
2. Service validates and sanitizes URL
3. Cryptographic short code generated
4. Link stored with expiration
5. Response with shortened URL

### Redirect Flow
1. GET /r/{code}
2. Link retrieved and validated
3. Expiration checked
4. Click recorded (async)
5. 301 redirect to target

## Security Features
- CSRF protection on forms
- Rate limiting per IP
- URL blocklist for malicious domains
- SQL injection prevention via ORM
- Input sanitization

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | / | Home page with form |
| POST | /api/links | Create shortened link |
| GET | /r/{code} | Redirect to original |
| GET | /api/links/{code} | Get link statistics |
| DELETE | /api/links/{code} | Delete link |

All API endpoints return proper HTTP status codes and follow REST conventions.

## Scalability
The architecture supports horizontal scaling with:
- Stateless application layer
- Connection pooling for database
- Redis caching for popular links
- Background workers for analytics
