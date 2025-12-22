"""
Flask application entry point

Usage:
    python run.py

Wart: Development server only - do not use in production
"""
from app import create_app

app = create_app()

if __name__ == '__main__':
    # Wart: Debug mode hardcoded - should check environment
    app.run(debug=True, port=5000)
