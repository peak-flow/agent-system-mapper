"""
Flask configuration

ARCHITECTURE NOTE:
Simple config for demo. In production would use:
- Environment-based configs (dev/staging/prod)
- Secret management (not hardcoded)
- Database connection pooling
"""
import os

class Config:
    # Wart: Secret key should never be hardcoded
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-me')

    # Wart: SQLite for demo, no connection pooling
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        'sqlite:///links.db'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Link settings
    SHORT_CODE_LENGTH = 6
    BASE_URL = os.environ.get('BASE_URL', 'http://localhost:5000')

    # Wart: No rate limiting config
    # RATE_LIMIT = '100/hour'
