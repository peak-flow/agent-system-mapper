"""
TaskTracker API - Main entry point
"""
from fastapi import FastAPI
from app.api import projects, tasks, users
from app.core.database import engine, Base

# Create tables on startup - not recommended for production
# but fine for this example app
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TaskTracker API",
    description="Simple task and project management API",
    version="1.0.0"
)

# Include routers
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(projects.router, prefix="/projects", tags=["projects"])
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
