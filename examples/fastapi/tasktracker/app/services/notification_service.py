"""
Notification service - sends webhooks for task events
"""
import httpx
import logging

from app.core.config import settings
from app.models.task import Task

logger = logging.getLogger(__name__)


class NotificationService:
    """
    Service for sending notifications via webhook.
    Wart: No retry logic, failures are silently logged.
    """

    def send_task_created(self, task: Task) -> None:
        """Send notification when task is created"""
        if not settings.NOTIFICATION_ENABLED:
            return

        self._send_webhook({
            "event": "task.created",
            "task_id": task.id,
            "title": task.title,
            "project_id": task.project_id
        })

    def send_task_completed(self, task: Task) -> None:
        """Send notification when task is completed"""
        if not settings.NOTIFICATION_ENABLED:
            return

        self._send_webhook({
            "event": "task.completed",
            "task_id": task.id,
            "title": task.title,
            "project_id": task.project_id
        })

    def _send_webhook(self, payload: dict) -> None:
        """
        Send webhook to configured URL.
        Wart: Synchronous HTTP call in async context.
        """
        if not settings.NOTIFICATION_WEBHOOK_URL:
            logger.warning("Notification webhook URL not configured")
            return

        try:
            # Wart: Should use async httpx in production
            with httpx.Client(timeout=5.0) as client:
                response = client.post(
                    settings.NOTIFICATION_WEBHOOK_URL,
                    json=payload
                )
                response.raise_for_status()
        except httpx.HTTPError as e:
            # Wart: Silently fails, no retry
            logger.error(f"Failed to send notification: {e}")
