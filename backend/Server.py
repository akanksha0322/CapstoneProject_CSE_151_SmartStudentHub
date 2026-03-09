from fastapi import FastAPI
from routes.auth_routes import router as auth_router
from routes.students import router as student_router
from routes.admin_students import router as admin_student_router
from routes.platform_super_admins import router as platform_super_admin_router
from routes.platform_admins import router as platform_admins_router
from routes.Faculty_students import router as faculty_student_router
from core.cors import setup_cors
from core.logger import setup_logger
from routes.faculty import router as faculty_router
from routes.Admins import router as admin_router
from routes.students_user import router as student_User_router
from routes.students_marks import router as student_Marks_router
from routes.files import router as files_router
from routes.Public_View import router as public_view_router
from routes.Students_common import router as student_common_router
from routes.Student_project import router as student_project_router 
from routes.complaints import router as complaints_router   
from routes.Complaints_platformAdmin import router as complaints_platform_router
app = FastAPI(docs_url=None,        # disables /docs
    redoc_url=None,       # disables /redoc
    openapi_url=None )
setup_cors(app)
logger = setup_logger("app")
app.include_router(auth_router)
app.include_router(student_router)
app.include_router(admin_student_router)
app.include_router(platform_super_admin_router)
app.include_router(platform_admins_router)
app.include_router(admin_router)
app.include_router(faculty_student_router)
app.include_router(student_Marks_router)
app.include_router(student_User_router)
app.include_router(files_router)
app.include_router(faculty_router)
app.include_router(public_view_router)
app.include_router(student_common_router)
app.include_router(student_project_router)
app.include_router(complaints_router)
app.include_router(complaints_platform_router)


