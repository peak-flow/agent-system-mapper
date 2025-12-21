"""
User Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    """Schema for creating a user"""
    email: EmailStr
    name: str


class UserUpdate(BaseModel):
    """Schema for updating a user"""
    name: Optional[str] = None


class UserResponse(BaseModel):
    """Schema for user response"""
    id: int
    email: str
    name: str
    created_at: datetime

    class Config:
        from_attributes = True
