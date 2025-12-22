"""
Flask application factory

ARCHITECTURE NOTE:
Uses factory pattern for testability. However:
- No blueprint organization (all routes in one file)
- Database created in app context (not via migrations)
- No proper error handlers configured
"""
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def create_app(config_class=None):
    """
    Create and configure Flask application.

    Wart: Config is optional - defaults could cause issues
    """
    app = Flask(__name__)

    if config_class:
        app.config.from_object(config_class)
    else:
        # Wart: Falls back to default config silently
        from config import Config
        app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)

    # Register routes
    from app.routes import links
    app.register_blueprint(links.bp)

    # Create tables
    # Wart: Should use migrations, not create_all
    with app.app_context():
        db.create_all()

    return app
