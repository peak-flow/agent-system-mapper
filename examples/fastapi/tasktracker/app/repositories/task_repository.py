"""
Task repository - data access layer
"""
from sqlalchemy.orm import Session
from typing import Optional, List

from app.models.task import Task, TaskStatus
from app.schemas.task import TaskCreate, TaskUpdate


class TaskRepository:
    """Repository for Task data access"""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, task_id: int) -> Optional[Task]:
        """Get task by ID"""
        return self.db.query(Task).filter(Task.id == task_id).first()

    def get_by_project(self, project_id: int) -> List[Task]:
        """Get all tasks for a project"""
        return self.db.query(Task).filter(Task.project_id == project_id).all()

    def get_by_assignee(self, assignee_id: int) -> List[Task]:
        """Get all tasks assigned to a user"""
        return self.db.query(Task).filter(Task.assignee_id == assignee_id).all()

    def get_overdue(self) -> List[Task]:
        """Get all overdue tasks"""
        from datetime import datetime, timezone
        return self.db.query(Task).filter(
            Task.due_date < datetime.now(timezone.utc),
            Task.status != TaskStatus.DONE
        ).all()

    def count_by_project(self, project_id: int) -> int:
        """Count tasks in a project"""
        return self.db.query(Task).filter(Task.project_id == project_id).count()

    def create(self, task_data: TaskCreate) -> Task:
        """Create a new task"""
        task = Task(
            title=task_data.title,
            description=task_data.description,
            project_id=task_data.project_id,
            assignee_id=task_data.assignee_id,
            priority=task_data.priority,
            due_date=task_data.due_date
        )
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return task

    def update(self, task: Task, task_data: TaskUpdate) -> Task:
        """Update an existing task"""
        if task_data.title is not None:
            task.title = task_data.title
        if task_data.description is not None:
            task.description = task_data.description
        if task_data.status is not None:
            task.status = task_data.status
        if task_data.priority is not None:
            task.priority = task_data.priority
        if task_data.assignee_id is not None:
            task.assignee_id = task_data.assignee_id
        if task_data.due_date is not None:
            task.due_date = task_data.due_date
        self.db.commit()
        self.db.refresh(task)
        return task

    def delete(self, task: Task) -> None:
        """Delete a task"""
        self.db.delete(task)
        self.db.commit()
