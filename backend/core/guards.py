from fastapi import Depends, HTTPException
from bson import ObjectId
from core.auth import get_current_user
from db.collections import (
    platform_admins_collection,
    super_admins_collection,
    users_collection,
    faculty_collection,
)

# ======================================================
# PLATFORM ADMIN (GLOBAL)
# ======================================================

async def require_platform_admin(
    user=Depends(get_current_user)
):
    if user["role"] != "platform_admin":
        raise HTTPException(403, "Platform admin access required")

    admin = await platform_admins_collection.find_one(
        {"_id": ObjectId(user["user_id"])}
    )

    if not admin or not admin.get("is_active"):
        raise HTTPException(403, "Account inactive")

    return user



# ======================================================
# SUPER ADMIN (ONE UNIVERSITY)
# ======================================================

async def require_super_admin(user=Depends(get_current_user)):
    if not user or user.get("role") != "super_admin":
        raise HTTPException(403, "Super admin access required")

    admin = await super_admins_collection.find_one(
        {"_id": ObjectId(user["user_id"]), "is_active": True}
    )

    if not admin:
        raise HTTPException(403, "Super admin inactive or not found")

    if not admin.get("university"):
        raise HTTPException(403, "University not configured")

    return admin   # contains university.name


# ======================================================
# UNIVERSITY ADMIN (ONE UNIVERSITY)
# ======================================================

async def require_admin(user=Depends(get_current_user)):
    if not user or user.get("role") != "admin":
        raise HTTPException(403, "University admin access required")

    admin = await users_collection.find_one(
        {"_id": ObjectId(user["user_id"]), "is_active": True}
    )

    if not admin:
        raise HTTPException(403, "Admin inactive or not found")

    if not admin.get("admin_meta", {}).get("university_id"):
        raise HTTPException(403, "Admin university not found")

    return admin   # admin_meta.university_id


# ======================================================
# FACULTY (ONE UNIVERSITY)
# ======================================================

async def require_faculty(user=Depends(get_current_user)):
    if not user or user.get("role") != "faculty":
        raise HTTPException(403, "Faculty access required")

    faculty = await faculty_collection.find_one(
        {"_id": ObjectId(user["user_id"]), "is_active": True}
    )

    if not faculty:
        raise HTTPException(403, "Faculty inactive or not found")

    if not faculty.get("academic", {}).get("university_id"):
        raise HTTPException(403, "Faculty university not assigned")

    return faculty   # academic.university_id


# ======================================================
# STUDENT (ONE UNIVERSITY)
# ======================================================

async def require_student(user=Depends(get_current_user)):
    if not user or user.get("role") != "student":
        raise HTTPException(403, "Student access required")

    student = await users_collection.find_one(
        {"_id": ObjectId(user["user_id"]), "is_active": True}
    )

    if not student:
        raise HTTPException(403, "Student inactive or not found")

    if not student.get("academic", {}).get("university_aishe"):
        raise HTTPException(403, "Student university not assigned")

    return student   # academic.university
