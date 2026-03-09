from pydantic import BaseModel
from typing import Optional

class StudentFilterSchema(BaseModel):
    university: Optional[str] = None
    department: Optional[str] = None
    program: Optional[str] = None
    batch_year: Optional[int] = None
    semester: Optional[int] = None
    is_active: Optional[bool] = None
    profile_completed: Optional[bool] = None
    faculty_verified: Optional[bool] = None


class StudentStatusUpdate(BaseModel):
    is_active: bool


class AdminResetPasswordRequest(BaseModel):
    reason: Optional[str] = None
