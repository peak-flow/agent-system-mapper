"""
Project model
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class ProjectStatus(enum.Enum):
    """Project status options"""
    ACTIVE = "active"
    ARCHIVED = "archived"
    COMPLETED = "completed"


class Project(Base):
    """Project entity - contains tasks"""

    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.ACTIVE)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    owner = relationship("User", back_populates="projects")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")

    def task_count(self) -> int:
        """Get number of tasks in project"""
        return len(self.tasks)

    def completed_task_count(self) -> int:
        """Get number of completed tasks"""
        # Wart: imports TaskStatus here to avoid circular import
        from app.models.task import TaskStatus
        return len([t for t in self.tasks if t.status == TaskStatus.DONE])
