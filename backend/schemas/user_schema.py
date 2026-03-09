from pydantic import BaseModel, EmailStr
from typing import Optional
from models.user_model import Role

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    username: str
    password: str
    role: Role
    institution: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str
