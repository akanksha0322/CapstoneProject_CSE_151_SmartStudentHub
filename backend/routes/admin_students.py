from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from datetime import datetime, timedelta
from bson import ObjectId

from db.collections import super_admins_collection , users_collection
from core.auth import get_current_user
from services.token_service import generate_reset_token
from services.email_service import send_email
from services.email_templates import build_password_email
from utils.serializer import serialize_mongo


# =====================================================
# ACCESS GUARD
# =====================================================

def require_admin(user: dict = Depends(get_current_user)):
    if user.get("role") not in ["super_admin", "platform_admin"]:
        raise HTTPException(403, "Admin access required")
    return user


router = APIRouter(
    prefix="/admin",
    tags=["Admin – Students"],
    dependencies=[Depends(require_admin)]
)

# =====================================================
# LIST STUDENTS (UNIVERSITY ISOLATED)
# =====================================================

@router.get("/students")
async def get_all_students(
    admin: dict = Depends(require_admin),

    department: Optional[str] = Query(None),
    program: Optional[str] = Query(None),
    batch_year: Optional[int] = Query(None),
    semester: Optional[int] = Query(None),

    is_active: Optional[bool] = Query(None),
    profile_completed: Optional[bool] = Query(None),
    faculty_verified: Optional[bool] = Query(None),

    skip: int = 0,
    limit: int = 50,
):
    """
    - super_admin     → ONLY their university students
    - platform_admin  → ALL universities
    """

    filters = {"role": "student"}

    # 🔐 AUTHORITATIVE AISHE ISOLATION (DB-BASED)
    if admin["role"] == "super_admin":
        admin_id = admin.get("user_id") or admin.get("_id")
        if not admin_id:
            raise HTTPException(401, "Invalid admin token")

        super_admin = await super_admins_collection.find_one(
            {"_id": ObjectId(admin_id), "role": "super_admin"},
            {"university.aishe_code": 1}
        )

        if not super_admin:
            raise HTTPException(401, "Super admin not found")

        aishe = super_admin.get("university", {}).get("aishe_code")
        if not aishe:
            raise HTTPException(400, "AISHE code not linked to super admin")

        filters["academic.university_aishe"] = aishe

    # 🎯 OPTIONAL FILTERS
    if department:
        filters["academic.department"] = department
    if program:
        filters["academic.program"] = program
    if batch_year:
        filters["academic.batch_year"] = batch_year
    if semester:
        filters["academic.semester"] = semester
    if is_active is not None:
        filters["is_active"] = is_active
    if profile_completed is not None:
        filters["status.profile_completed"] = profile_completed
    if faculty_verified is not None:
        filters["status.faculty_verified"] = faculty_verified

    # ✅ CORRECT COLLECTION (STUDENTS LIVE HERE)
    cursor = (
        users_collection
        .find(filters, {"password": 0, "onboarding.reset_token": 0})
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )

    students = [serialize_mongo(doc) async for doc in cursor]
    total = await users_collection.count_documents(filters)

    return {
        "total": total,
        "count": len(students),
        "skip": skip,
        "limit": limit,
        "students": students,
    }


# =====================================================
# GET SINGLE STUDENT (UNIVERSITY SAFE)
# =====================================================

@router.get("/students/{student_id}")
async def get_student(
    student_id: str,
    admin: dict = Depends(require_admin),
):
    # ✅ fetch from correct collection
    student = await users_collection.find_one(
        {"_id": ObjectId(student_id), "role": "student"},
        {"password": 0, "onboarding.reset_token": 0}
    )

    if not student:
        raise HTTPException(404, "Student not found")

    # 🔐 AISHE ISOLATION FOR SUPER ADMIN (DB-BASED)
    if admin["role"] == "super_admin":
        admin_id = admin.get("user_id") or admin.get("_id")
        if not admin_id:
            raise HTTPException(401, "Invalid admin token")

        super_admin = await super_admins_collection.find_one(
            {"_id": ObjectId(admin_id), "role": "super_admin"},
            {"university.aishe_code": 1}
        )

        if not super_admin:
            raise HTTPException(401, "Super admin not found")

        aishe = super_admin.get("university", {}).get("aishe_code")
        if not aishe:
            raise HTTPException(400, "AISHE not linked to super admin")

        if student.get("academic", {}).get("university_aishe") != aishe:
            raise HTTPException(403, "Access denied")

    return serialize_mongo(student)


# =====================================================
# ACTIVATE / DEACTIVATE STUDENT
# =====================================================

@router.patch("/students/{student_id}/status")
async def update_student_status(
    student_id: str,
    is_active: bool = Query(...),
    admin: dict = Depends(require_admin),
):
    # ✅ FETCH STUDENT FROM CORRECT COLLECTION
    student = await users_collection.find_one({
        "_id": ObjectId(student_id),
        "role": "student"
    })

    if not student:
        raise HTTPException(404, "Student not found")

    # 🔐 AISHE ISOLATION FOR SUPER ADMIN (DB-BASED)
    if admin["role"] == "super_admin":
        admin_id = admin.get("user_id") or admin.get("_id")
        if not admin_id:
            raise HTTPException(401, "Invalid admin token")

        super_admin = await super_admins_collection.find_one(
            {"_id": ObjectId(admin_id), "role": "super_admin"},
            {"university.aishe_code": 1}
        )

        if not super_admin:
            raise HTTPException(401, "Super admin not found")

        aishe = super_admin.get("university", {}).get("aishe_code")
        if not aishe:
            raise HTTPException(400, "AISHE not linked to super admin")

        if student.get("academic", {}).get("university_aishe") != aishe:
            raise HTTPException(403, "Access denied")

    # ✅ UPDATE STUDENT STATUS
    await users_collection.update_one(
        {"_id": ObjectId(student_id)},
        {
            "$set": {
                "is_active": is_active,
                "meta.last_updated": datetime.utcnow()
            }
        }
    )

    return {"message": "Student status updated successfully"}

# =====================================================
# RESET PASSWORD
# =====================================================

@router.post("/students/{student_id}/reset-password")
async def reset_student_password(
    student_id: str,
    admin: dict = Depends(require_admin),
):
    # ✅ fetch student correctly
    student = await users_collection.find_one(
        {"_id": ObjectId(student_id), "role": "student"}
    )

    if not student:
        raise HTTPException(404, "Student not found")

    # 🔐 AISHE ISOLATION FOR SUPER ADMIN
    if admin["role"] == "super_admin":
        admin_id = admin.get("user_id") or admin.get("_id")
        if not admin_id:
            raise HTTPException(401, "Invalid admin token")

        super_admin = await super_admins_collection.find_one(
            {"_id": ObjectId(admin_id), "role": "super_admin"},
            {"university.aishe_code": 1}
        )

        if not super_admin:
            raise HTTPException(401, "Super admin not found")

        aishe = super_admin.get("university", {}).get("aishe_code")
        if not aishe:
            raise HTTPException(400, "AISHE not linked to super admin")

        if student.get("academic", {}).get("university_aishe") != aishe:
            raise HTTPException(403, "Access denied")

    reset_token = generate_reset_token()
    expiry = datetime.utcnow() + timedelta(hours=24)

    await users_collection.update_one(
        {"_id": ObjectId(student_id)},
        {
            "$set": {
                "onboarding.reset_token": reset_token,
                "onboarding.reset_token_exp": expiry,
                "is_active": False,
                "meta.last_updated": datetime.utcnow()
            }
        }
    )

    await send_email(
        to_email=student["email"],
        subject="Reset Your Smart Student Hub Password",
        html=build_password_email(student["name"], reset_token)
    )

    return {"message": "Password reset email sent successfully"}


# =====================================================
# BLOCK STUDENT
# =====================================================

@router.delete("/students/{student_id}")
async def block_student(
    student_id: str,
    admin: dict = Depends(require_admin),
):
    student = await super_admins_collection.find_one({"_id": ObjectId(student_id)})

    if not student:
        raise HTTPException(404, "Student not found")

    if admin["role"] == "super_admin":
        if student.get("academic", {}).get("university") != admin.get("university_id"):
            raise HTTPException(403, "Access denied")

    await super_admins_collection.update_one(
        {"_id": ObjectId(student_id)},
        {
            "$set": {
                "status.blocked": True,
                "is_active": False,
                "meta.last_updated": datetime.utcnow()
            }
        }
    )

    return {"message": "Student blocked successfully"}
