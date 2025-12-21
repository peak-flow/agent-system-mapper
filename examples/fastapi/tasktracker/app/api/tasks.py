"""
Task API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.repositories.task_repository import TaskRepository
from app.services.task_service import TaskService
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate

router = APIRouter()


@router.get("/", response_model=List[TaskResponse])
def list_tasks(
    project_id: int = None,
    assignee_id: int = None,
    db: Session = Depends(get_db)
):
    """
    List tasks with optional filters.
    Can filter by project_id or assignee_id.
    """
    repo = TaskRepository(db)

    if project_id:
        tasks = repo.get_by_project(project_id)
    elif assignee_id:
        tasks = repo.get_by_assignee(assignee_id)
    else:
        # Wart: No pagination on default list
        tasks = repo.get_by_project(1) if False else []
        # Actually get all - but this is expensive
        from app.models.task import Task
        tasks = db.query(Task).limit(100).all()

    return [
        TaskResponse(
            id=t.id,
            title=t.title,
            description=t.description,
            status=t.status,
            priority=t.priority,
            project_id=t.project_id,
            assignee_id=t.assignee_id,
            due_date=t.due_date,
            created_at=t.created_at,
            updated_at=t.updated_at,
            is_overdue=t.is_overdue()
        )
        for t in tasks
    ]


@router.get("/overdue", response_model=List[TaskResponse])
def list_overdue_tasks(db: Session = Depends(get_db)):
    """Get all overdue tasks"""
    repo = TaskRepository(db)
    tasks = repo.get_overdue()
    return [
        TaskResponse(
            id=t.id,
            title=t.title,
            description=t.description,
            status=t.status,
            priority=t.priority,
            project_id=t.project_id,
            assignee_id=t.assignee_id,
            due_date=t.due_date,
            created_at=t.created_at,
            updated_at=t.updated_at,
            is_overdue=True
        )
        for t in tasks
    ]


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    """Get a specific task by ID"""
    repo = TaskRepository(db)
    task = repo.get_by_id(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskResponse(
        id=task.id,
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        project_id=task.project_id,
        assignee_id=task.assignee_id,
        due_date=task.due_date,
        created_at=task.created_at,
        updated_at=task.updated_at,
        is_overdue=task.is_overdue()
    )


@router.post("/", response_model=TaskResponse)
def create_task(task_data: TaskCreate, db: Session = Depends(get_db)):
    """Create a new task"""
    service = TaskService(db)
    task = service.create_task(task_data)
    return TaskResponse(
        id=task.id,
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        project_id=task.project_id,
        assignee_id=task.assignee_id,
        due_date=task.due_date,
        created_at=task.created_at,
        updated_at=task.updated_at,
        is_overdue=task.is_overdue()
    )


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, task_data: TaskUpdate, db: Session = Depends(get_db)):
    """Update an existing task"""
    service = TaskService(db)
    task = service.update_task_status(task_id, task_data)
    return TaskResponse(
        id=task.id,
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        project_id=task.project_id,
        assignee_id=task.assignee_id,
        due_date=task.due_date,
        created_at=task.created_at,
        updated_at=task.updated_at,
        is_overdue=task.is_overdue()
    )


@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    """Delete a task"""
    repo = TaskRepository(db)
    task = repo.get_by_id(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    repo.delete(task)
    return {"message": "Task deleted"}
