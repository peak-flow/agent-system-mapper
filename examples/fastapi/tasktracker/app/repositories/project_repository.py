"""
Project repository - data access layer
"""
from sqlalchemy.orm import Session
from typing import Optional, List

from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate


class ProjectRepository:
    """Repository for Project data access"""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, project_id: int) -> Optional[Project]:
        """Get project by ID"""
        return self.db.query(Project).filter(Project.id == project_id).first()

    def get_by_owner(self, owner_id: int) -> List[Project]:
        """Get all projects for an owner"""
        return self.db.query(Project).filter(Project.owner_id == owner_id).all()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Project]:
        """Get all projects with pagination"""
        return self.db.query(Project).offset(skip).limit(limit).all()

    def create(self, project_data: ProjectCreate) -> Project:
        """Create a new project"""
        project = Project(
            name=project_data.name,
            description=project_data.description,
            owner_id=project_data.owner_id
        )
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)
        return project

    def update(self, project: Project, project_data: ProjectUpdate) -> Project:
        """Update an existing project"""
        if project_data.name is not None:
            project.name = project_data.name
        if project_data.description is not None:
            project.description = project_data.description
        if project_data.status is not None:
            project.status = project_data.status
        self.db.commit()
        self.db.refresh(project)
        return project

    def delete(self, project: Project) -> None:
        """Delete a project (cascades to tasks)"""
        self.db.delete(project)
        self.db.commit()
