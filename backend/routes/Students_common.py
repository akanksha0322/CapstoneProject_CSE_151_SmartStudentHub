from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from bson import ObjectId
from datetime import datetime

from core.guards import require_student
from db.collections import complaints_collection, users_collection
from db.gridfs import fs

router = APIRouter(
    prefix="/students",
    tags=["Students"],
    dependencies=[Depends(require_student)]
)

# ======================================================
# COMPLETE PROFILE (NO PHOTO URL HERE)
# ======================================================

@router.post("/profile")
async def update_student_profile(
    payload: dict,
    identity=Depends(require_student)
):
    required_profile_fields = [
        "phone",
        "dob",
        "gender",
        "blood_group",
        "address",
    ]

    required_academic_fields = [
        "current_year",
        "semester",
    ]

    for field in required_profile_fields:
        if not payload.get(field):
            raise HTTPException(400, f"{field} is required")

    for field in required_academic_fields:
        if payload.get(field) is None:
            raise HTTPException(400, f"{field} is required")

    result = await users_collection.update_one(
        {
            "_id": ObjectId(identity["_id"]),
            "role": "student"
        },
        {
            "$set": {
                "profile.phone": payload["phone"],
                "profile.dob": payload["dob"],
                "profile.gender": payload["gender"],
                "profile.blood_group": payload["blood_group"],
                "profile.address": payload["address"],

                "academic.current_year": int(payload["current_year"]),
                "academic.semester": int(payload["semester"]),

                "status.profile_completed": True,
                "meta.last_updated": datetime.utcnow()
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(404, "Student not found")

    return {"message": "Profile completed successfully"}

# ======================================================
# UPLOAD PROFILE PHOTO (GRIDFS ONLY)
# ======================================================

@router.post("/profile/photo")
async def upload_profile_photo(
    photo: UploadFile = File(...),
    identity=Depends(require_student)
):
    if photo.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(400, "Only JPG or PNG images allowed")

    photo_bytes = await photo.read()
    if not photo_bytes:
        raise HTTPException(400, "Empty file")

    file_id = fs.put(
        photo_bytes,
        filename=photo.filename,
        content_type=photo.content_type,
        uploaded_at=datetime.utcnow(),
        uploaded_by=ObjectId(identity["_id"])
    )

    photo_url = f"/files/{file_id}"

    await users_collection.update_one(
        {"_id": ObjectId(identity["_id"])},
        {
            "$set": {
                "profile.photo_url": photo_url,
                "meta.last_updated": datetime.utcnow()
            }
        }
    )

    return {
        "message": "Profile photo uploaded",
        "photo_url": photo_url
    }

# ======================================================
# CREATE COMPLAINT (UNIVERSITY ISOLATED)
# ======================================================

@router.post("/complaints")
async def create_complaint(
    payload: dict,
    identity=Depends(require_student)
):
    # 🛑 Validate payload
    for field in ("category", "subject", "description"):
        if not payload.get(field):
            raise HTTPException(400, f"{field} is required")

    # 🔑 Resolve student id safely
    student_id_raw = identity.get("_id") or identity.get("user_id")
    if not student_id_raw:
        raise HTTPException(401, "Invalid token")

    student_id = ObjectId(student_id_raw)

    # 🔍 Fetch student (AISHE is authoritative)
    student = await users_collection.find_one(
        {"_id": student_id, "role": "student"},
        {"academic.university_aishe": 1}
    )

    if not student:
        raise HTTPException(404, "Student not found")

    university_aishe = student.get("academic", {}).get("university_aishe")
    if not university_aishe:
        raise HTTPException(400, "Student university not configured")

    # 📌 Complaint document (ANONYMOUS BY DESIGN)
    complaint = {
        "raised_by": student_id,
        "raised_by_role": "student",

        # 🔒 STRICT TENANT ISOLATION
        "university_aishe": university_aishe,

        "category": payload["category"],
        "subject": payload["subject"],
        "description": payload["description"],

        "against": payload.get(
            "against",
            {"type": "none", "ref_id": None}
        ),

        "status": "open",
        "remarks": None,

        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    await complaints_collection.insert_one(complaint)

    return {"message": "Complaint submitted successfully"}


# ======================================================
# LIST MY COMPLAINTS
# ======================================================

@router.get("/complaints")
async def my_complaints(identity=Depends(require_student)):
    cursor = complaints_collection.find(
        {"raised_by": ObjectId(identity["_id"])}
    ).sort("created_at", -1)

    results = []
    async for c in cursor:
        c["_id"] = str(c["_id"])
        c["raised_by"] = str(c["raised_by"])
        results.append(c)

    return results

@router.get("/projects")
async def list_student_projects(identity=Depends(require_student)):
    # 🔑 Resolve student id safely
    student_id_raw = identity.get("_id") or identity.get("user_id")
    if not student_id_raw:
        raise HTTPException(401, "Invalid token")

    student_id = ObjectId(student_id_raw)

    student = await users_collection.find_one(
        {"_id": student_id, "role": "student"},
        {"projects": 1}
    )

    if not student:
        raise HTTPException(404, "Student not found")

    projects = []

    for p in student.get("projects", []):
        projects.append({
            "id": str(p["_id"]),
            "title": p.get("title"),
            "github_url": p.get("github_url"),
            "deployment_url": p.get("deployment_url"),
            "status": p.get("status"),
            "remarks": p.get("remarks"),
            "submitted_at": (
                p.get("submitted_at").isoformat()
                if p.get("submitted_at") else None
            ),
        })

    return projects
