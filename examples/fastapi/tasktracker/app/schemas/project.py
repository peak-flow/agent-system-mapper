"""
Project Pydantic schemas for request/response validation
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.project import ProjectStatus


class ProjectCreate(BaseModel):
    """Schema for creating a project"""
    name: str
    description: Optional[str] = None
    owner_id: int


class ProjectUpdate(BaseModel):
    """Schema for updating a project"""
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None


class ProjectResponse(BaseModel):
    """Schema for project response"""
    id: int
    name: str
    description: Optional[str]
    status: ProjectStatus
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime]
    task_count: int = 0

    class Config:
        from_attributes = True
