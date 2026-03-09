from pydantic import BaseModel

class ExcelStudentRow(BaseModel):
    name: str
    email: str
    register_no: str
    department: str
    program: str
    batch_year: int
    admission_year: int
    admission_type: str
