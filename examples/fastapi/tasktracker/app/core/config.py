"""
Application configuration
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Application settings loaded from environment"""

    PROJECT_NAME: str = "TaskTracker"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./tasktracker.db")

    # Notification settings - external webhook
    NOTIFICATION_WEBHOOK_URL: str = os.getenv("NOTIFICATION_WEBHOOK_URL", "")
    NOTIFICATION_ENABLED: bool = os.getenv("NOTIFICATION_ENABLED", "false").lower() == "true"

    # Wart: Magic number for task limit, duplicated in TaskService
    MAX_TASKS_PER_PROJECT: int = 100


settings = Settings()
