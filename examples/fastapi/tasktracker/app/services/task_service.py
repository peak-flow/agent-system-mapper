"""
Task service - business logic layer
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.task import Task
from app.repositories.task_repository import TaskRepository
from app.repositories.project_repository import ProjectRepository
from app.schemas.task import TaskCreate, TaskUpdate
from app.services.notification_service import NotificationService


class TaskService:
    """Service for task business logic"""

    # Wart: Magic number duplicated from config.py
    MAX_TASKS_PER_PROJECT = 100

    def __init__(self, db: Session):
        self.db = db
        self.task_repo = TaskRepository(db)
        self.project_repo = ProjectRepository(db)
        self.notification_service = NotificationService()

    def create_task(self, task_data: TaskCreate) -> Task:
        """
        Create a new task with validation.
        Sends notification on creation.
        """
        # Validate project exists
        project = self.project_repo.get_by_id(task_data.project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Check task limit
        current_count = self.task_repo.count_by_project(task_data.project_id)
        if current_count >= self.MAX_TASKS_PER_PROJECT:
            raise HTTPException(
                status_code=400,
                detail=f"Project has reached maximum of {self.MAX_TASKS_PER_PROJECT} tasks"
            )

        task = self.task_repo.create(task_data)

        # Send notification (fire and forget)
        self.notification_service.send_task_created(task)

        return task

    def update_task_status(self, task_id: int, task_data: TaskUpdate) -> Task:
        """Update task, send notification if status changed to done"""
        task = self.task_repo.get_by_id(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        old_status = task.status
        updated_task = self.task_repo.update(task, task_data)

        # Notify if task completed
        if task_data.status and task_data.status.value == "done" and old_status.value != "done":
            self.notification_service.send_task_completed(updated_task)

        return updated_task
