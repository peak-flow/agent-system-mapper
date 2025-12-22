"""
URL shortening service

ARCHITECTURE NOTE:
Handles short code generation and link operations.
Issues:
- Short codes are sequential-ish (predictable)
- No URL validation/sanitization
- No blocklist for malicious URLs
- No collision handling for high volume
"""
import string
import random
from datetime import datetime
from flask import current_app
from app import db
from app.models import Link


class ShortenerService:
    """
    Service for creating and managing shortened URLs.

    Wart: Stateless service class - could be plain functions
    """

    # Characters for short codes
    # Wart: Includes easily confused characters (0/O, 1/l)
    ALPHABET = string.ascii_letters + string.digits

    @classmethod
    def create_short_link(cls, original_url, custom_code=None, expires_at=None):
        """
        Create a shortened link.

        Args:
            original_url: The URL to shorten
            custom_code: Optional custom short code
            expires_at: Optional expiration datetime

        Returns:
            Link object

        Wart: No validation of original_url (could be malicious)
        Wart: No rate limiting
        """
        # Generate or validate short code
        if custom_code:
            short_code = custom_code
            # Wart: No validation of custom code format
        else:
            short_code = cls._generate_short_code()

        # Check for collision
        existing = Link.query.filter_by(short_code=short_code).first()
        if existing:
            # Wart: Raises generic error, no retry logic
            raise ValueError(f'Short code {short_code} already exists')

        # Create link
        link = Link(
            short_code=short_code,
            original_url=original_url,
            expires_at=expires_at,
        )

        db.session.add(link)
        db.session.commit()

        return link

    @classmethod
    def _generate_short_code(cls):
        """
        Generate a random short code.

        Wart: Uses random.choice which is not cryptographically secure.
        For URL shorteners this is usually fine, but pattern is predictable.

        Wart: No retry on collision - caller must handle
        """
        length = current_app.config.get('SHORT_CODE_LENGTH', 6)
        return ''.join(random.choice(cls.ALPHABET) for _ in range(length))

    @classmethod
    def get_link_by_code(cls, short_code):
        """
        Retrieve link by short code.

        Wart: Does not check expiration
        """
        return Link.query.filter_by(short_code=short_code).first()

    @classmethod
    def record_click(cls, link):
        """
        Record a click on a link.

        Wart: Non-atomic increment (see model comment)
        Wart: No click metadata (IP, user agent, referrer)
        """
        link.increment_clicks()
        db.session.commit()

    @classmethod
    def get_stats(cls, short_code):
        """
        Get statistics for a link.

        Wart: Only returns click count, no analytics
        """
        link = cls.get_link_by_code(short_code)
        if not link:
            return None

        return {
            'short_code': link.short_code,
            'original_url': link.original_url,
            'click_count': link.click_count,
            'created_at': link.created_at.isoformat() if link.created_at else None,
            # Wart: Shows expiration but doesn't enforce it
            'expires_at': link.expires_at.isoformat() if link.expires_at else None,
            'is_expired': cls._is_expired(link),
        }

    @classmethod
    def _is_expired(cls, link):
        """
        Check if link is expired.

        Note: This check exists but is never called in redirect flow!
        """
        if not link.expires_at:
            return False
        return datetime.utcnow() > link.expires_at

    @classmethod
    def delete_link(cls, short_code):
        """
        Delete a link.

        Wart: Hard delete only, no audit trail
        """
        link = cls.get_link_by_code(short_code)
        if link:
            db.session.delete(link)
            db.session.commit()
            return True
        return False
