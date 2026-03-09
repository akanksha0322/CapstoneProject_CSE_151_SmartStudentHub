from pydantic import BaseModel, Field
from typing import Optional
from datetime import date

class Academic(BaseModel):
    university: str
    department: str
    program: str
    batch_year: int
    admission_year: int
    admission_type: str
    current_year: Optional[int] = None
    semester: Optional[int] = None


class ProfileInfo(BaseModel):
    phone: Optional[str] = None
    dob: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    address: Optional[str] = None
    photo_url: Optional[str] = None

class StudentCreate(BaseModel):
    name: str
    email: str
    register_no: str
    academic: AcademicInfo
