from enum import Enum

class Role(str, Enum):
    SUPER_ADMIN = "super_admin"
    FACULTY = "faculty"
    TEACHER = "teacher"
    STUDENT = "student"
