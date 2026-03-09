from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime
from typing import List

from core.guards import require_student
from db.collections import users_collection, faculty_collection

router = APIRouter(
    prefix="/students/projects",
    tags=["Student Projects"],
    dependencies=[Depends(require_student)]
)

# ======================================================
# SUBMIT PROJECT (SECURE + UNIVERSITY ISOLATED)
# ======================================================

@router.post("/submit")
async def submit_project(
    payload: dict,
    identity=Depends(require_student)
):
    # --------------------------------------------------
    # 1️⃣ VALIDATE PAYLOAD
    # --------------------------------------------------
    required_fields = [
        "title",
        "description",
        "github_url",
        "assigned_faculty_ids"
    ]

    for field in required_fields:
        if not payload.get(field):
            raise HTTPException(400, f"{field} is required")

    if not isinstance(payload["assigned_faculty_ids"], list):
        raise HTTPException(
            400,
            "assigned_faculty_ids must be a list"
        )

    # --------------------------------------------------
    # 2️⃣ RESOLVE STUDENT ID (JWT SAFE)
    # --------------------------------------------------
    student_id_raw = identity.get("_id") or identity.get("user_id")
    if not student_id_raw:
        raise HTTPException(401, "Invalid token")

    student_id = ObjectId(student_id_raw)

    # --------------------------------------------------
    # 3️⃣ FETCH STUDENT + AISHE (AUTHORITATIVE)
    # --------------------------------------------------
    student = await users_collection.find_one(
        {"_id": student_id, "role": "student"},
        {"academic.university_aishe": 1}
    )

    if not student:
        raise HTTPException(404, "Student not found")

    university_aishe = student.get(
        "academic", {}
    ).get("university_aishe")

    if not university_aishe:
        raise HTTPException(
            400,
            "Student university not configured"
        )

    # --------------------------------------------------
    # 4️⃣ VALIDATE FACULTY (BACKWARD COMPATIBLE)
    # --------------------------------------------------
    try:
        faculty_ids = [
            ObjectId(fid)
            for fid in payload["assigned_faculty_ids"]
        ]
    except Exception:
        raise HTTPException(
            400,
            "Invalid faculty id format"
        )

    valid_faculty_count = await faculty_collection.count_documents(
        {
            "_id": {"$in": faculty_ids},
            "is_active": True,

            # ✅ BACKWARD-COMPATIBLE ISOLATION
            "$or": [
                {"academic.university_aishe": university_aishe},
                {"academic.university_id": university_aishe}
            ]
        }
    )

    if valid_faculty_count != len(faculty_ids):
        raise HTTPException(
            403,
            "One or more faculty members are invalid or belong to another university"
        )

    # --------------------------------------------------
    # 5️⃣ CREATE PROJECT (NO UNIVERSITY FIELD STORED)
    # --------------------------------------------------
    project = {
        "_id": ObjectId(),

        "title": payload["title"],
        "description": payload["description"],
        "github_url": payload["github_url"],
        "deployment_url": payload.get("deployment_url"),

        "assigned_faculty_ids": faculty_ids,

        "status": "pending",
        "remarks": None,

        "submitted_at": datetime.utcnow(),
        "verified_by": None,
        "verified_at": None
    }

    await users_collection.update_one(
        {"_id": student_id},
        {"$push": {"projects": project}}
    )

    return {
        "message": "Project submitted successfully",
        "project_id": str(project["_id"])
    }