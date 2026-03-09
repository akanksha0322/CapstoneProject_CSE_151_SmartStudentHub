from pydantic import BaseModel, EmailStr
from typing import Optional

class FacultyExcelRow(BaseModel):
    name: str
    email: EmailStr
    employee_id: str
    department: str
    designation: str
    employment_type: str
    joining_year: int

    can_verify_certificates: Optional[bool] = True
    can_verify_projects: Optional[bool] = True
    can_verify_internships: Optional[bool] = False
