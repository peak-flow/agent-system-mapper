"""
Link model - stores shortened URLs

ARCHITECTURE NOTE:
Simple model with click tracking. Issues:
- No soft delete (hard deletes only)
- No expiration support despite field existing
- Click count not atomic (race condition possible)
- No index on short_code despite being primary lookup
"""
from datetime import datetime
from app import db


class Link(db.Model):
    """
    Represents a shortened URL.

    Wart: expires_at exists but is never checked
    """
    __tablename__ = 'links'

    id = db.Column(db.Integer, primary_key=True)
    short_code = db.Column(db.String(10), unique=True, nullable=False)
    # Wart: No index on short_code despite frequent lookups

    original_url = db.Column(db.String(2048), nullable=False)
    # Wart: No URL validation at model level

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)
    # Wart: expires_at is stored but never enforced

    click_count = db.Column(db.Integer, default=0)
    # Wart: Increment is not atomic - race condition in high traffic

    # Optional: creator tracking (not implemented)
    # user_id = db.Column(db.Integer, db.ForeignKey('users.id'))

    def __repr__(self):
        return f'<Link {self.short_code} -> {self.original_url[:30]}...>'

    def to_dict(self):
        """Serialize link to dictionary."""
        return {
            'id': self.id,
            'short_code': self.short_code,
            'original_url': self.original_url,
            'short_url': f'/r/{self.short_code}',
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'click_count': self.click_count,
        }

    def increment_clicks(self):
        """
        Increment click counter.

        Wart: This is NOT atomic - concurrent requests could
        read same value and both write value+1, losing clicks.
        Proper solution: db.session.execute(update().values(click_count=Link.click_count + 1))
        """
        self.click_count += 1
